import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getEmployee(userId: string) {
  return prisma.employee.findFirst({
    where: { user: { id: userId } },
  });
}

/**
 * GET /api/dashboard/settings
 * Returns current settings for the authenticated employee.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employee = await getEmployee(session.user.id);
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const [nokRecord, assetRecord, keywords, oauthGoogle] = await Promise.all([
    prisma.nextOfKin.findUnique({ where: { employeeId: employee.id } }),
    prisma.assetInfo.findUnique({ where: { employeeId: employee.id } }),
    prisma.blacklistKeyword.findMany({
      where: { employeeId: employee.id },
      select: { keyword: true },
    }),
    prisma.oAuthConnection.findFirst({
      where: { employeeId: employee.id, provider: "google", revokedAt: null },
    }),
  ]);

  return NextResponse.json({
    nextOfKin: nokRecord
      ? {
          name: nokRecord.name,
          email: nokRecord.email,
          phone: nokRecord.phone ?? "",
          relation: nokRecord.relation ?? "",
        }
      : null,
    assetInfoJson: assetRecord?.dataJson ?? "",
    blacklistKeywords: keywords.map((k) => k.keyword),
    googleConnected: !!oauthGoogle,
  });
}

/**
 * PUT /api/dashboard/settings
 * Upserts a specific settings section for the authenticated employee.
 * Body: { section: "nextOfKin" | "assets" | "keywords", ...fields }
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employee = await getEmployee(session.user.id);
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const body = await req.json();
  const { section } = body as { section: string };

  if (section === "nextOfKin") {
    const { name, email, phone, relation } = body as {
      name?: string;
      email?: string;
      phone?: string;
      relation?: string;
    };
    if (!name || !email) {
      return NextResponse.json(
        { error: "name と email は必須です。" },
        { status: 400 },
      );
    }
    await prisma.nextOfKin.upsert({
      where: { employeeId: employee.id },
      create: {
        employeeId: employee.id,
        name,
        email,
        phone: phone ?? null,
        relation: relation ?? null,
      },
      update: {
        name,
        email,
        phone: phone ?? null,
        relation: relation ?? null,
      },
    });
    return NextResponse.json({ success: true });
  }

  if (section === "assets") {
    const { dataJson } = body as { dataJson?: string };
    await prisma.assetInfo.upsert({
      where: { employeeId: employee.id },
      create: { employeeId: employee.id, dataJson: dataJson ?? "" },
      update: { dataJson: dataJson ?? "" },
    });
    return NextResponse.json({ success: true });
  }

  if (section === "keywords") {
    const { keywords } = body as { keywords?: string[] };
    if (!Array.isArray(keywords)) {
      return NextResponse.json({ error: "keywords は配列です。" }, { status: 400 });
    }
    // Replace all keywords atomically
    await prisma.$transaction([
      prisma.blacklistKeyword.deleteMany({
        where: { employeeId: employee.id },
      }),
      ...keywords.map((kw) =>
        prisma.blacklistKeyword.create({
          data: { employeeId: employee.id, keyword: kw },
        }),
      ),
    ]);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown section" }, { status: 400 });
}

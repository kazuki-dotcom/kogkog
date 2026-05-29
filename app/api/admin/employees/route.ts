import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/employees
 * Returns the list of employees for the calling admin's company.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { adminCompanyId: true },
  });

  if (!admin?.adminCompanyId) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const employees = await prisma.employee.findMany({
    where: { companyId: admin.adminCompanyId },
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      activationTokens: {
        where: { usedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ employees });
}

/**
 * POST /api/admin/employees
 * Create a new employee record (PENDING, no user account yet).
 * Body: { name, email, department?, jobTitle? }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { adminCompanyId: true },
  });

  if (!admin?.adminCompanyId) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, email, department, jobTitle } = body as {
    name?: string;
    email?: string;
    department?: string;
    jobTitle?: string;
  };

  if (!name || !email) {
    return NextResponse.json({ error: "name と email は必須です。" }, { status: 400 });
  }

  // Check for duplicate employee email across users
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "このメールアドレスはすでに登録されています。" },
      { status: 409 },
    );
  }

  // We create a placeholder User for the employee so the email is reserved.
  // passwordHash remains null until the employee completes activation.
  // The unique constraint on User.email prevents duplicates even under concurrent requests.
  const employee = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, role: "EMPLOYEE" },
    });
    return tx.employee.create({
      data: {
        userId: user.id,
        companyId: admin.adminCompanyId!,
        department: department ?? null,
        jobTitle: jobTitle ?? null,
        status: "PENDING",
      },
    });
  });

  return NextResponse.json({ employee }, { status: 201 });
}

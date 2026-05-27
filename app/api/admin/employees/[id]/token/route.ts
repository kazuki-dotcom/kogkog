import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateActivationToken, TOKEN_EXPIRY_MS } from "@/lib/tokens";

/**
 * POST /api/admin/employees/[id]/token
 * Generate (or re-generate) an activation token for the given employee.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { adminCompanyId: true },
  });

  if (!admin?.adminCompanyId) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee || employee.companyId !== admin.adminCompanyId) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  if (employee.status === "ACTIVE") {
    return NextResponse.json(
      { error: "この従業員はすでにアクティベート済みです。" },
      { status: 400 },
    );
  }

  // Invalidate any existing unused tokens
  await prisma.activationToken.updateMany({
    where: { employeeId: id, usedAt: null },
    data: { expiresAt: new Date() }, // expire immediately
  });

  const token = generateActivationToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  await prisma.activationToken.create({
    data: { token, employeeId: id, expiresAt },
  });

  return NextResponse.json({ token });
}

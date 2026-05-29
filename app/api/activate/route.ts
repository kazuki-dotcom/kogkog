import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeToken, TOKEN_EXPIRY_MS } from "@/lib/tokens";
import bcrypt from "bcryptjs";
import { ActivationToken, Employee } from "@prisma/client";

/** Finds a valid (unused, unexpired) activation token for the given raw token string. */
async function findValidToken(
  raw: string,
): Promise<(ActivationToken & { employee: Employee }) | null> {
  const record = await prisma.activationToken.findUnique({
    where: { token: raw },
    include: { employee: true },
  });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt < new Date()) return null;
  if (record.employee.status !== "PENDING") return null;
  return record;
}

/**
 * POST /api/activate
 * Step 1: verify the activation token.
 * Body: { token: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = normalizeToken(String(body.token ?? ""));

    if (!raw) {
      return NextResponse.json(
        { error: "コードを入力してください。" },
        { status: 400 },
      );
    }

    const record = await findValidToken(raw);

    if (!record) {
      return NextResponse.json(
        { error: "コードが無効または期限切れです。管理者に再発行を依頼してください。" },
        { status: 400 },
      );
    }

    return NextResponse.json({ employeeId: record.employeeId });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/activate
 * Step 2: set name / email / password on the pre-created placeholder User
 *         and flip the Employee to ACTIVE.
 * Body: { employeeId, name, email, password }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, name, email, password } = body as {
      employeeId?: string;
      name?: string;
      email?: string;
      password?: string;
    };

    if (!employeeId || !name || !email || !password) {
      return NextResponse.json(
        { error: "必須項目が未入力です。" },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上にしてください。" },
        { status: 400 },
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { activationTokens: true, user: true },
    });

    if (!employee || employee.status !== "PENDING") {
      return NextResponse.json(
        { error: "アクティベーション対象が見つかりません。" },
        { status: 404 },
      );
    }

    // Re-validate that a valid token still exists for this employee
    const validToken = employee.activationTokens.find(
      (t) => !t.usedAt && t.expiresAt > new Date(),
    );
    if (!validToken) {
      return NextResponse.json(
        { error: "有効なコードが見つかりません。" },
        { status: 400 },
      );
    }

    // If the employee wants to change their email, ensure no OTHER user owns it
    if (email !== employee.user.email) {
      const emailTaken = await prisma.user.findFirst({
        where: { email, id: { not: employee.userId } },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: "このメールアドレスはすでに使用されています。" },
          { status: 409 },
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      // Update the pre-created placeholder user with the employee's chosen credentials
      prisma.user.update({
        where: { id: employee.userId },
        data: { name, email, passwordHash },
      }),
      // Activate the employee record
      prisma.employee.update({
        where: { id: employeeId },
        data: { status: "ACTIVE" },
      }),
      // Mark the token as used
      prisma.activationToken.update({
        where: { id: validToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
}

/** Re-export TOKEN_EXPIRY_MS for use in tests */
export { TOKEN_EXPIRY_MS };

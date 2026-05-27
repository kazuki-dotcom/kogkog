import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EmployeeStatusBadge } from "@/components/EmployeeStatusBadge";
import { TokenPanel } from "@/components/TokenPanel";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const admin = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { adminCompanyId: true },
  });

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      activationTokens: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      equipment: true,
    },
  });

  if (!employee || employee.companyId !== admin?.adminCompanyId) {
    notFound();
  }

  const activeToken = employee.activationTokens.find(
    (t) => !t.usedAt && t.expiresAt > new Date(),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/employees"
          className="text-sm text-gray-500 hover:underline"
        >
          ← 従業員一覧
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {employee.user?.name ?? "（未設定）"}
          </h1>
          <p className="text-sm text-gray-500">{employee.user?.email}</p>
        </div>
        <EmployeeStatusBadge status={employee.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">部署</dt>
              <dd className="font-medium">{employee.department ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">役職</dt>
              <dd className="font-medium">{employee.jobTitle ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">登録日</dt>
              <dd className="font-medium">
                {employee.createdAt.toLocaleDateString("ja-JP")}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Activation token panel */}
        <TokenPanel
          employeeId={employee.id}
          status={employee.status}
          activeToken={
            activeToken
              ? { token: activeToken.token, expiresAt: activeToken.expiresAt }
              : null
          }
        />
      </div>

      {/* Equipment list */}
      <Card>
        <CardHeader>
          <CardTitle>貸与備品</CardTitle>
        </CardHeader>
        {employee.equipment.length === 0 ? (
          <p className="text-sm text-gray-400">備品が登録されていません。</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {employee.equipment.map((eq) => (
              <li key={eq.id} className="flex items-center justify-between py-2">
                <span className="font-medium">{eq.name}</span>
                <span className="text-gray-500">{eq.assetTag ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

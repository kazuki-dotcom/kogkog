import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EmployeeStatusBadge } from "@/components/EmployeeStatusBadge";

export default async function EmployeesPage() {
  const session = await auth();

  const admin = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { adminCompanyId: true },
  });

  const employees = await prisma.employee.findMany({
    where: { companyId: admin!.adminCompanyId! },
    include: {
      user: { select: { name: true, email: true } },
      activationTokens: {
        where: { usedAt: null },
        orderBy: { expiresAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">従業員管理</h1>
        <Link
          href="/admin/employees/new"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          ＋ 従業員を追加
        </Link>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-500">まだ従業員が登録されていません。</p>
          <Link
            href="/admin/employees/new"
            className="mt-4 inline-block text-sm text-red-600 hover:underline"
          >
            最初の従業員を追加する →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">氏名</th>
                <th className="px-4 py-3 text-left">メール</th>
                <th className="px-4 py-3 text-left">部署 / 役職</th>
                <th className="px-4 py-3 text-left">ステータス</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {emp.user?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {emp.user?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {[emp.department, emp.jobTitle]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EmployeeStatusBadge status={emp.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/employees/${emp.id}`}
                      className="text-red-600 hover:underline"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

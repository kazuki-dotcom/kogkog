import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export default async function AdminDashboardPage() {
  const session = await auth();

  const admin = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: {
      adminCompany: {
        include: {
          employees: { select: { status: true } },
        },
      },
    },
  });

  const company = admin?.adminCompany;
  const employees = company?.employees ?? [];
  const total = employees.length;
  const active = employees.filter((e) => e.status === "ACTIVE").length;
  const pending = employees.filter((e) => e.status === "PENDING").length;
  const deceased = employees.filter((e) => e.status === "DECEASED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {company?.name ?? "管理者"} ダッシュボード
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Dead Man&apos;s Switch 管理コンソール
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "従業員数", value: total, color: "text-gray-900" },
          { label: "有効化済み", value: active, color: "text-green-700" },
          { label: "未有効化", value: pending, color: "text-yellow-700" },
          { label: "トリガー発動済み", value: deceased, color: "text-red-700" },
        ].map((stat) => (
          <Card key={stat.label} className="text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/employees"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            従業員一覧を見る
          </Link>
          <Link
            href="/admin/employees/new"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ＋ 従業員を追加
          </Link>
        </div>
      </Card>
    </div>
  );
}

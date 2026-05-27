import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmployeeStatusBadge } from "@/components/EmployeeStatusBadge";

export default async function DashboardPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: {
      employee: {
        include: {
          company: { select: { name: true } },
          blacklistKeywords: true,
          assetInfo: { select: { id: true } },
          nextOfKin: true,
          oauthConnections: { select: { provider: true, revokedAt: true } },
        },
      },
    },
  });

  const employee = user?.employee;
  const setupItems = [
    {
      label: "遺族の連絡先",
      done: !!employee?.nextOfKin,
      href: "/dashboard/settings#next-of-kin",
    },
    {
      label: "資産情報（銀行・保険）",
      done: !!employee?.assetInfo,
      href: "/dashboard/settings#assets",
    },
    {
      label: "削除キーワード（Gmail）",
      done: (employee?.blacklistKeywords.length ?? 0) > 0,
      href: "/dashboard/settings#keywords",
    },
    {
      label: "Google アカウント連携",
      done: employee?.oauthConnections.some(
        (c) => c.provider === "google" && !c.revokedAt,
      ) ?? false,
      href: "/dashboard/settings#oauth",
    },
  ];
  const doneCount = setupItems.filter((i) => i.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          こんにちは、{user?.name ?? "さん"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {employee?.company?.name} — Dead Man&apos;s Switch
        </p>
      </div>

      {employee && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">ステータス:</span>
          <EmployeeStatusBadge status={employee.status} />
        </div>
      )}

      {/* Setup progress */}
      <Card>
        <CardHeader>
          <CardTitle>
            事前設定の進捗 ({doneCount}/{setupItems.length})
          </CardTitle>
        </CardHeader>
        <ul className="space-y-3">
          {setupItems.map((item) => (
            <li key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg ${item.done ? "text-green-500" : "text-gray-300"}`}
                >
                  {item.done ? "✓" : "○"}
                </span>
                <span
                  className={`text-sm ${item.done ? "text-gray-900" : "text-gray-500"}`}
                >
                  {item.label}
                </span>
              </div>
              {!item.done && (
                <Link
                  href={item.href}
                  className="text-xs text-red-600 hover:underline"
                >
                  設定する →
                </Link>
              )}
            </li>
          ))}
        </ul>
        {doneCount < setupItems.length && (
          <div className="mt-4">
            <Link
              href="/dashboard/settings"
              className="inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              設定を続ける
            </Link>
          </div>
        )}
      </Card>

      {/* Informational card */}
      <Card className="border-yellow-200 bg-yellow-50">
        <p className="text-sm text-yellow-800">
          <strong>このシステムについて:</strong> Dead Man&apos;s Switch は、万が一のときに
          あなたのプライバシーを守り、ご家族に必要な情報だけをお届けするサービスです。
          上記の事前設定を完了しておくことをお勧めします。
        </p>
      </Card>
    </div>
  );
}

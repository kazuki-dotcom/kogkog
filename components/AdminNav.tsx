"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: "/admin", label: "ダッシュボード", exact: true },
  { href: "/admin/employees", label: "従業員管理" },
];

export function AdminNav({ companyName }: { companyName?: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-red-700">⚡ DMS</span>
          {companyName && (
            <span className="text-sm text-gray-500">— {companyName}</span>
          )}
        </div>
        <ul className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-red-50 text-red-700"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        ログアウト
      </Button>
    </nav>
  );
}

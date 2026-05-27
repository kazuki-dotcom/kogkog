"use client";

import { useState } from "react";
import { EmployeeStatus } from "@prisma/client";
import { formatToken, TOKEN_EXPIRY_MS } from "@/lib/tokens";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props {
  employeeId: string;
  status: EmployeeStatus;
  activeToken: { token: string; expiresAt: Date } | null;
}

export function TokenPanel({ employeeId, status, activeToken }: Props) {
  const [token, setToken] = useState<string | null>(
    activeToken?.token ?? null,
  );
  const [expiresAt, setExpiresAt] = useState<Date | null>(
    activeToken?.expiresAt ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateToken() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/employees/${employeeId}/token`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました。");
      return;
    }
    setToken(data.token);
    setExpiresAt(new Date(Date.now() + TOKEN_EXPIRY_MS));
  }

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(formatToken(token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>アクティベーションコード</CardTitle>
      </CardHeader>

      {status === "ACTIVE" ? (
        <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
          ✓ この従業員はすでにアカウントを有効化しています。
        </p>
      ) : status === "DECEASED" ? (
        <p className="text-sm text-red-700 bg-red-50 rounded-md px-3 py-2">
          トリガーが発動されています。新しいコードは発行できません。
        </p>
      ) : (
        <div className="space-y-3">
          {token ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                従業員にこのコードを共有してください:
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
                <code className="flex-1 text-sm font-mono tracking-widest">
                  {formatToken(token)}
                </code>
                <Button variant="ghost" size="sm" onClick={copyToken}>
                  {copied ? "コピー済み ✓" : "コピー"}
                </Button>
              </div>
              {expiresAt && (
                <p className="text-xs text-gray-400">
                  有効期限: {expiresAt.toLocaleDateString("ja-JP")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              コードが発行されていません。
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={generateToken}
          >
            {token ? "コードを再発行する" : "コードを発行する"}
          </Button>
        </div>
      )}
    </Card>
  );
}

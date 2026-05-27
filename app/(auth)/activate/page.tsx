"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Step = "code" | "setup";

export default function ActivatePage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("code");
  const [token, setToken] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  // Setup form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTokenSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.toUpperCase().replace(/-/g, "") }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "無効なコードです。");
      return;
    }

    setEmployeeId(data.employeeId);
    setStep("setup");
  }

  async function handleSetupSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("パスワードが一致しません。");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/activate", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "アカウント作成に失敗しました。");
      return;
    }

    // Auto sign-in after activation
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInRes?.error) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-700">⚡ Dead Man&apos;s Switch</h1>
          <p className="mt-2 text-sm text-gray-500">
            {step === "code"
              ? "アクティベーションコードを入力してください"
              : "アカウントを作成してください"}
          </p>
        </div>

        <Card>
          {step === "code" ? (
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <Input
                label="アクティベーションコード"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className="font-mono uppercase tracking-widest"
              />
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" loading={loading}>
                コードを確認
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
                ✓ コードが確認されました。アカウント情報を入力してください。
              </p>
              <Input
                label="氏名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="山田 太郎"
              />
              <Input
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
              <Input
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8文字以上"
                minLength={8}
              />
              <Input
                label="パスワード（確認）"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="同じパスワードを入力"
              />
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" loading={loading}>
                アカウントを作成してログイン
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm text-gray-500">
            <Link href="/login" className="text-red-600 hover:underline">
              ログインページへ戻る
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

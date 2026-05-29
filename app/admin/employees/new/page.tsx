"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

export default function NewEmployeePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, department, jobTitle }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました。");
      return;
    }

    router.push(`/admin/employees/${data.employee.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/employees" className="text-sm text-gray-500 hover:underline">
          ← 従業員一覧
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">従業員を追加</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="氏名 *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="山田 太郎"
          />
          <Input
            label="メールアドレス *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="yamada@company.com"
          />
          <Input
            label="部署"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="営業部"
          />
          <Input
            label="役職"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="営業マネージャー"
          />

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              登録してコードを発行する
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

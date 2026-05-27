"use client";

import { useState, FormEvent, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

interface SettingsData {
  nextOfKin: { name: string; email: string; phone: string; relation: string } | null;
  assetInfoJson: string;
  blacklistKeywords: string[];
  googleConnected: boolean;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Next-of-kin fields
  const [nokName, setNokName] = useState("");
  const [nokEmail, setNokEmail] = useState("");
  const [nokPhone, setNokPhone] = useState("");
  const [nokRelation, setNokRelation] = useState("");

  // Asset info (free-text JSON stored server-side)
  const [assetText, setAssetText] = useState("");

  // Blacklist keywords
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/settings")
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setData(d);
        if (d.nextOfKin) {
          setNokName(d.nextOfKin.name);
          setNokEmail(d.nextOfKin.email);
          setNokPhone(d.nextOfKin.phone);
          setNokRelation(d.nextOfKin.relation);
        }
        setAssetText(d.assetInfoJson ?? "");
        setKeywords(d.blacklistKeywords ?? []);
        setLoading(false);
      });
  }, []);

  async function saveNok(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/dashboard/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "nextOfKin",
        name: nokName,
        email: nokEmail,
        phone: nokPhone,
        relation: nokRelation,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedMsg("保存しました ✓");
      setTimeout(() => setSavedMsg(null), 3000);
    } else {
      setError("保存に失敗しました。");
    }
  }

  async function saveAssets(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/dashboard/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "assets", dataJson: assetText }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedMsg("保存しました ✓");
      setTimeout(() => setSavedMsg(null), 3000);
    } else {
      setError("保存に失敗しました。");
    }
  }

  async function addKeyword() {
    const kw = newKeyword.trim();
    if (!kw || keywords.includes(kw)) return;
    const next = [...keywords, kw];
    setKeywords(next);
    setNewKeyword("");
    await fetch("/api/dashboard/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "keywords", keywords: next }),
    });
  }

  async function removeKeyword(kw: string) {
    const next = keywords.filter((k) => k !== kw);
    setKeywords(next);
    await fetch("/api/dashboard/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "keywords", keywords: next }),
    });
  }

  if (loading) {
    return <p className="text-sm text-gray-400">読み込み中…</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">事前設定</h1>

      {savedMsg && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {savedMsg}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Next-of-kin */}
      <Card id="next-of-kin">
        <CardHeader>
          <CardTitle>遺族の連絡先</CardTitle>
        </CardHeader>
        <form onSubmit={saveNok} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="氏名"
              value={nokName}
              onChange={(e) => setNokName(e.target.value)}
              required
              placeholder="山田 花子"
            />
            <Input
              label="続柄"
              value={nokRelation}
              onChange={(e) => setNokRelation(e.target.value)}
              placeholder="配偶者・子・親 など"
            />
          </div>
          <Input
            label="メールアドレス"
            type="email"
            value={nokEmail}
            onChange={(e) => setNokEmail(e.target.value)}
            required
            placeholder="hanako@example.com"
          />
          <Input
            label="電話番号"
            type="tel"
            value={nokPhone}
            onChange={(e) => setNokPhone(e.target.value)}
            placeholder="090-0000-0000"
          />
          <Button type="submit" loading={saving}>
            保存
          </Button>
        </form>
      </Card>

      {/* Asset info */}
      <Card id="assets">
        <CardHeader>
          <CardTitle>資産情報（銀行・保険）</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-gray-500">
          遺族に伝えるべき銀行口座・保険・その他財産情報を自由に入力してください。
          この情報は暗号化されて保存されます。
        </p>
        <form onSubmit={saveAssets} className="space-y-4">
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            rows={6}
            value={assetText}
            onChange={(e) => setAssetText(e.target.value)}
            placeholder="例:&#10;・○○銀行 ××支店 普通 1234567&#10;・△△生命保険 証券番号: 0000000&#10;・○○証券 口座番号: xxxxxxx"
          />
          <Button type="submit" loading={saving}>
            保存
          </Button>
        </form>
      </Card>

      {/* Blacklist keywords */}
      <Card id="keywords">
        <CardHeader>
          <CardTitle>削除キーワード（Gmail）</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-gray-500">
          トリガー発動時にGmailから削除したいキーワードを登録してください。
        </p>
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="例: 消費者金融、マッチングアプリ"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addKeyword();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addKeyword}>
            追加
          </Button>
        </div>
        {keywords.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <li
                key={kw}
                className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
              >
                {kw}
                <button
                  onClick={() => removeKeyword(kw)}
                  className="ml-1 text-gray-400 hover:text-red-600"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Google OAuth placeholder */}
      <Card id="oauth">
        <CardHeader>
          <CardTitle>Google アカウント連携</CardTitle>
        </CardHeader>
        <p className="text-sm text-gray-500">
          {data?.googleConnected
            ? "✓ Google アカウントと連携済みです。"
            : "Google アカウントと連携することで、トリガー発動時に検索履歴・YouTube視聴履歴・Googleマップ履歴を自動削除できます。"}
        </p>
        <div className="mt-4">
          <Button
            variant="secondary"
            disabled={data?.googleConnected}
            onClick={() => {
              // OAuth flow will be implemented in Phase 2
              alert("Google OAuth は Phase 2 で実装予定です。");
            }}
          >
            {data?.googleConnected ? "連携済み" : "Google と連携する"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

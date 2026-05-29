# kogkog - デッドマンズスイッチ SaaS

B2B向け「デッドマンズスイッチ」SaaSのMVPを構築：企業管理者が死亡トリガーを発動すると、システムが個人データを削除し、資産情報と共に近親者に通知し、HRオフボーディングを自動化します。このPRはフェーズ1：二段階認証とアカウント基盤をカバーしています。

## 技術スタック
Next.js 16 (App Router) · Tailwind CSS · Prisma 5 · NextAuth v5 (credentials + JWT) · Supabase (PostgreSQL)

## データモデル
- `Company` → `User` (role: `ADMIN | EMPLOYEE`) → `Employee` (status: `PENDING → ACTIVE → DECEASED`)
- `ActivationToken` — 管理者が発行する単一使用、7日間有効の招待コード
- `BlacklistKeyword`, `AssetInfo`, `NextOfKin`, `OAuthConnection`, `Equipment` — 従業員の死亡前設定

## 認証とルーティング
- `proxy.ts` がロールベースのルート保護を実施：未認証 → `/login`、クロスロールアクセス → リダイレクト
- JWTコールバックが`session.user`に`id`と`role`を公開

## 管理者フロー
- ステータスバッジ付き従業員一覧/詳細 (`PENDING / ACTIVE / DECEASED / REVOKED`)
- トークン生成UI (`TokenPanel`) — コードを発行/再発行し、フォーマット済み`XXXX-XXXX-…`トークンをクリップボードにコピー
- `POST /api/admin/employees` — トランザクション内でプレースホルダー`User`（`passwordHash`なし）経由でメールを予約；DB一意制約が同時競合を処理

## 従業員アクティベーション
`/activate`での2ステップフロー：
1. `POST /api/activate` — トークンを検証（未使用、未期限切れ、従業員がまだ`PENDING`）
2. `PUT /api/activate` — 選択した名前/メール/パスワードでプレースホルダー`User`を更新し、従業員を`ACTIVE`に切り替え、トークンを使用済みにマーク — すべて単一の`$transaction`内で実行

```ts
// アクティベーションは新しいUserを作成するのではなく、事前作成されたプレースホルダーを更新するため、
// 管理者が予約したメールが重複として誤って拒否されることはありません。
await prisma.$transaction([
  prisma.user.update({ where: { id: employee.userId }, data: { name, email, passwordHash } }),
  prisma.employee.update({ where: { id: employeeId }, data: { status: "ACTIVE" } }),
  prisma.activationToken.update({ where: { id: validToken.id }, data: { usedAt: new Date() } }),
]);
```

## 従業員ダッシュボードと設定
- セットアップ進捗チェックリスト（近親者、資産情報、ブラックリストキーワード、Google OAuthプレースホルダー）
- `section`判別子（`nextOfKin | assets | keywords`）を使用して`PUT /api/dashboard/settings`経由で設定を保存

## 開発セットアップ
`TOKEN_EXPIRY_MS`定数はAPIルートと`TokenPanel` UIの間で共有されます。`prisma/seed.ts`のシードスクリプトがサンプル企業+管理者（`admin@example.com / password123`）を作成します。

---

## はじめに

開発サーバーを起動：

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて結果を確認してください。

## 環境設定

1. `.env.example`を`.env`にコピー
2. データベース接続文字列とNextAuth設定を構成
3. `npx prisma migrate dev`でデータベースをセットアップ
4. `npx prisma db seed`でサンプルデータをシード

## 認証情報（開発用）

シード後、以下の認証情報でログイン可能：
- 管理者: `admin@example.com / password123`

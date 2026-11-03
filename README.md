# school-kakeibo

収入・支出を記録し、月別・週別の推移、カテゴリ別の内訳、予算の使用状況を確認できる家計簿アプリです。

> 開発中です。機能と画面は順次追加します。要件は [docs/requirements.md](docs/requirements.md) を参照してください。

## 画面

<!-- 機能ができるたびに docs/images/ にスクリーンショットを追加し、ここに載せる -->
準備中

## 使用技術

| 領域 | 技術 |
|---|---|
| フロントエンド | Next.js (App Router) / React / TypeScript |
| スタイル | Tailwind CSS |
| バックエンド/DB | Supabase (PostgreSQL) |
| ホスティング | Vercel（予定） |

## セットアップ

必要なもの: Node.js 20 以上、[Supabase](https://supabase.com/) のアカウント

1. 依存パッケージをインストールする

   ```sh
   npm install
   ```

2. Supabase でプロジェクトを作成し、Project URL と anon (publishable) key を控える
3. `.env.example` を `.env.local` にコピーして、値を設定する

   ```sh
   cp .env.example .env.local
   ```

4. 開発サーバーを起動し、http://localhost:3000 を開く。「接続できました」と表示されれば成功

   ```sh
   npm run dev
   ```

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番ビルド |
| `npm run lint` | ESLint を実行 |

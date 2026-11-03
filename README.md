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
| データベース | MySQL 8.4（Docker で起動） |
| DB アクセス | mysql2 |

ローカルで動かすアプリです（公開 URL はありません）。

## セットアップ

必要なもの: Node.js 20 以上、Docker（Docker Desktop）

1. 依存パッケージをインストールする

   ```sh
   npm install
   ```

2. MySQL を起動する（初回はイメージのダウンロードに時間がかかります）

   ```sh
   docker compose up -d
   ```

3. 開発サーバーを起動し、http://localhost:3000 を開く。「接続できました（MySQL 8.x）」と表示されれば成功

   ```sh
   npm run dev
   ```

初回の起動時に、`db/init/` の SQL でテーブル・初期カテゴリ・サンプルデータ（直近約5か月分）が自動で作られます。データを最初の状態に戻したいときは、`docker compose down -v` のあとにもう一度 `docker compose up -d` を実行します。

接続先を変えたいときは、`.env.example` を `.env.local` にコピーして値を書き換えます（デフォルトは `docker-compose.yml` と同じ値なので、通常は不要です）。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番ビルド |
| `npm run lint` | ESLint を実行 |
| `docker compose up -d` | MySQL を起動 |
| `docker compose down` | MySQL を停止（データは残る） |
| `docker compose down -v` | MySQL を停止し、データも削除 |

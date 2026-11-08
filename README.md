# school-kakeibo

収入・支出を記録し、月別・週別の推移、カテゴリ別の内訳、予算の使用状況を確認できる家計簿アプリです。

> 開発中です。機能と画面は順次追加します。要件は [docs/requirements.md](docs/requirements.md) を参照してください。

## 画面

<!-- 完成した時点で docs/images/ にスクリーンショットと動画を追加し、ここに載せる -->
準備中

## 使用技術

| 領域 | 技術 |
|---|---|
| フロントエンド | Next.js 16 (App Router) / React 19 / TypeScript 6 |
| スタイル | Tailwind CSS 4 |
| データベース | MySQL 9.7（LTS。Docker で起動） |
| DB アクセス | mysql2 |
| グラフ | Recharts |
| テスト | Vitest |
| 実行環境 | Node.js 26（LTS） |

ローカルで動かすアプリです（公開 URL はありません）。認証がないため、開発サーバー（3000）と MySQL（3306）は、このパソコン（127.0.0.1）からの接続だけを受け付けます。

## セットアップ

必要なもの: Node.js 26（LTS）以上、Docker（Docker Desktop）

1. 依存パッケージをインストールする

   ```sh
   npm install
   ```

2. MySQL を起動する（初回はイメージのダウンロードに時間がかかります）

   ```sh
   docker compose up -d
   ```

3. 開発サーバーを起動し、http://localhost:3000 を開く。ダッシュボード（今月の収入・支出など）が表示されれば成功

   ```sh
   npm run dev
   ```

初回の起動時に、`db/init/` の SQL でテーブル・初期カテゴリ・サンプルデータ（直近約5か月分）が自動で作られます。データを最初の状態に戻したいときは、`docker compose down -v` のあとにもう一度 `docker compose up -d` を実行します。

接続先を変えたいときは、`.env.example` を `.env.local` にコピーして値を書き換えます（デフォルトは `docker-compose.yml` と同じ値なので、通常は不要です）。

### MySQL 8.4 から 9.7 への移行（以前のデータが残っている場合）

MySQL は 9.7（LTS）を使います。8.4 で作ったデータは、9.7 で起動したときに自動で移行されます（初回の起動は数十秒かかります）。**9.7 に移行したデータは 8.4 では使えなくなる**ので、先にバックアップを取ってください。

```sh
# 1. バックアップ（8.4 で動いている状態で実行。backup.sql は Git に含めない）
docker compose exec db sh -c "mysqldump -uroot -proot --single-transaction --no-tablespaces --set-gtid-purged=OFF kakeibo > /tmp/backup.sql"
docker compose cp db:/tmp/backup.sql ./backup.sql

# 2. 9.7 で起動し直す（コンテナが作り直され、データが移行される）
docker compose up -d
```

元に戻したいときは、`docker compose down -v` でデータを消してから起動し直し、バックアップを読み込みます（8.4 に戻すときは、先に `docker-compose.yml` のイメージを `mysql:8.4` にします）。

```sh
docker compose cp ./backup.sql db:/tmp/backup.sql
docker compose exec db sh -c "mysql -uroot -proot kakeibo < /tmp/backup.sql"
```

- バックアップと読み込みは管理者（root）で行います。MySQL 9.7 の `mysqldump` は、アプリ用のユーザー（kakeibo）にない権限を必要とするためです。パスワードは `docker-compose.yml` の開発用の値です。
- バックアップは、Windows の PowerShell の `>` で直接ファイルに書き出さないでください（文字コードが UTF-16 になり、読み込めなくなります）。上のように、コンテナの中で作ってからコピーします。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番ビルド |
| `npm run lint` | ESLint を実行 |
| `npm test` | 自動テスト（Vitest）を実行 |
| `docker compose up -d` | MySQL を起動 |
| `docker compose down` | MySQL を停止（データは残る） |
| `docker compose down -v` | MySQL を停止し、データも削除 |

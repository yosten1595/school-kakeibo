// 空のデータベースに、テーブルと初期カテゴリを作る。
// RDS は Docker の MySQL と違い db/init/*.sql を自動で実行しないため、デプロイ後に 1 回だけ実行する。
// すでにテーブルがあるときは何もしない（何度実行しても安全）。
//
// 使い方: node scripts/db-init.mjs            … テーブル + 初期カテゴリ
//         node scripts/db-init.mjs --sample   … さらにサンプルデータも入れる
// 接続情報は src/lib/db/pool.ts と同じ環境変数（MYSQL_HOST など）から読む。
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const initDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "init");
const files = ["01_schema.sql", "02_categories.sql"];
if (process.argv.includes("--sample")) files.push("03_sample_data.sql");

const database = process.env.MYSQL_DATABASE ?? "kakeibo";
const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? "kakeibo",
  password: process.env.MYSQL_PASSWORD ?? "kakeibo",
  database,
  timezone: "+09:00",
  // 自分で用意した SQL ファイル（db/init）だけを実行するため、複数文の実行を許可する
  multipleStatements: true,
});

try {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
    [database, "categories"],
  );
  if (rows[0].n > 0) {
    console.log("テーブルはすでにあります。何もしませんでした。");
  } else {
    for (const file of files) {
      const sql = await readFile(path.join(initDir, file), "utf8");
      await conn.query(sql);
      console.log(`実行しました: ${file}`);
    }
    console.log("データベースを初期化しました。");
  }
} finally {
  await conn.end();
}

import mysql from "mysql2/promise";

// サーバー側（Server Components / Server Actions）からだけ使う。
// ブラウザ側のコードから import しないこと。
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? "127.0.0.1", // localhost だと IPv6（::1）に解決されることがあり、127.0.0.1 だけで待ち受ける MySQL に届かない
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? "kakeibo",
  password: process.env.MYSQL_PASSWORD ?? "kakeibo",
  database: process.env.MYSQL_DATABASE ?? "kakeibo",
  timezone: "+09:00",
  dateStrings: true, // DATE を JS の Date ではなく "YYYY-MM-DD" の文字列で受け取る
  connectionLimit: 5,
});

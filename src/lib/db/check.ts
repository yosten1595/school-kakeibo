import type { RowDataPacket } from "mysql2";
import { pool } from "./pool";

export type ConnectionStatus =
  | { ok: true; version: string }
  | { ok: false; reason: string };

export async function checkDbConnection(): Promise<ConnectionStatus> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT VERSION() AS version");
    return { ok: true, version: String(rows[0].version) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "接続に失敗しました";
    return {
      ok: false,
      reason: `${message}（docker compose up -d で MySQL を起動していますか？）`,
    };
  }
}

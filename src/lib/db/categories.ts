import type { RowDataPacket } from "mysql2";
import { pool } from "./pool";
import type { Category } from "@/lib/types";

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  type: "income" | "expense";
}

export async function listCategories(): Promise<Category[]> {
  const [rows] = await pool.query<CategoryRow[]>(
    "SELECT id, name, type FROM categories ORDER BY type DESC, id",
  );
  return rows.map((r) => ({ id: r.id, name: r.name, type: r.type }));
}

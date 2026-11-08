import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// DB を使わない計算・検証の処理のテスト（src/**/*.test.ts）。npm test で実行する
export default defineConfig({
  resolve: {
    // tsconfig.json の paths（@/* → src/*）と同じ
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});

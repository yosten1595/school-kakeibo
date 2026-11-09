# 家計簿アプリの本番用イメージ。
# ビルド: docker build -t kakeibo-app .
# 実行:   docker run -p 3000:3000 -e MYSQL_HOST=... -e MYSQL_PASSWORD=... kakeibo-app

# 1. 依存パッケージを入れる
FROM node:26-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. ビルドする（output: "standalone" で .next/standalone ができる）
FROM node:26-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. DB 初期化スクリプト用の mysql2（アプリ本体では mysql2 はビルド時にまとめられ、単体では残らないため）
#    package-lock.json と同じ版を入れる
FROM node:26-slim AS dbinit
WORKDIR /dbinit
COPY package-lock.json /tmp/package-lock.json
RUN npm init -y > /dev/null \
 && npm install --omit=dev --no-audit --no-fund \
      "mysql2@$(node -p "require('/tmp/package-lock.json').packages['node_modules/mysql2'].version")"

# 4. 実行用。本番で必要なファイルだけを入れる
FROM node:26-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# DB の初期化スクリプト（RDS は db/init を自動で実行しないため、これで作る）
COPY --from=builder --chown=node:node /app/db/init ./db/init
COPY --from=builder --chown=node:node /app/scripts/db-init.mjs ./scripts/db-init.mjs
COPY --from=dbinit --chown=node:node /dbinit/node_modules ./scripts/node_modules

USER node
EXPOSE 3000
CMD ["node", "server.js"]

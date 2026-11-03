# school-kakeibo – Claude Code 作業ルール

スクール課題の家計簿アプリ。以下は厳守するルール。例外は認めない。迷ったら作業を止めてユーザーに確認する。

## 1. Issue ファースト
- コード・ドキュメントの変更を伴う作業は、**必ず先に GitHub Issue を作る**（既存 Issue があればそれを使う）。
- Issue なしでブランチ作成・コミットをしない。
- Issue は `.github/ISSUE_TEMPLATE/` のテンプレートに沿って、目的・完了条件を書く。
- 作成は `gh issue create`。作成前に重複する Issue がないか `gh issue list` で確認する。

## 2. ブランチ
- `main` では作業しない。`main` への直接コミット・直接 push は禁止。
- 命名規則: `<type>/<issue番号>-<kebab-case の短い説明>`
  - type: `feature` / `fix` / `docs` / `refactor` / `chore` / `test`
  - 例: `feature/3-add-expense-form`
  - 正規表現: `^(feature|fix|docs|refactor|chore|test)/[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$`
- 1 Issue = 1 ブランチ = 1 PR。ブランチは最新の `main` から切る。

## 3. コミット
- メッセージは英語の命令形で簡潔に。末尾に関連 Issue を `(#3)` の形で付ける。
- 例: `Add expense form (#3)`
- 1 コミット 1 論理変更。無関係な変更を混ぜない。

## 4. Push と Pull Request
- push は作業ブランチのみ。`--force` / `--force-with-lease` は使わない。
- 変更は必ず PR 経由で `main` に入れる。PR 本文には `Closes #<番号>` を入れ、`.github/pull_request_template.md` に沿って書く。
- PR の作成まではやってよいが、**マージはユーザーが行う**（Claude はマージしない）。
- ブランチ保護を回避・解除する操作をしない。

## 5. README とスクリーンショット
- README には「何を作ったか」が分かるよう、実際の画面のスクリーンショット（または動画/GIF）を載せる。
- 画像・動画は `docs/images/` に置き、README から相対パスで参照する。
- 画面を変えた PR では、該当するスクリーンショットも更新する。

## 6. 強制の仕組み
- `.claude/hooks/guard-git.ps1`（`.claude/settings.json` の PreToolUse フック）が、機械的に判定できる次のものをブロックする:
  - main 上での `git commit` / `git push`、main・master を対象とする push
  - force push
  - 命名規則に違反するブランチの作成
  - Issue 番号を含まない `gh pr create`、`gh pr merge`
- フックが拒否した場合は回避せず、ルールに沿ってやり直す（Issue を作る等）。

## 7. 技術構成
- Next.js (App Router) + React + TypeScript + Tailwind CSS / Supabase (PostgreSQL) / Vercel。認証は使わない（1人専用）。要件は `docs/requirements.md`。
- **Next.js のコードを書く前に、`node_modules/next/dist/docs/` の該当ガイドを読む**（このバージョンは `cacheComponents` が有効で、従来の知識と異なる。例: `export const dynamic` は使えず、リクエスト時の処理は `await connection()` + `<Suspense>`）。詳細は `AGENTS.md`。
- ソースは `src/`、Supabase 関連は `src/lib/supabase/`。パスエイリアスは `@/*` = `src/*`。
- 開発サーバー: `npm run dev`（http://localhost:3000）。変更後は `npm run lint` と `npm run build` を通す。
- Supabase の接続情報は `.env.local`（Git に含めない）。キーを増やしたら `.env.example` も更新する。
- DB のテーブルを作るときは `docs/requirements.md` の「6. データ設計」に合わせる。変更したら要件定義書も更新する。

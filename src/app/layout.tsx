import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "家計簿アプリ",
  description: "収支を記録して、月別・週別の推移や予算を確認できる家計簿アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-2xl items-center gap-5 px-4 py-3">
            <Link href="/" className="font-bold">
              家計簿
            </Link>
            <Link href="/" className="text-zinc-700 hover:underline dark:text-zinc-300">
              ダッシュボード
            </Link>
            <Link href="/transactions" className="text-zinc-700 hover:underline dark:text-zinc-300">
              収支一覧
            </Link>
            <Link href="/categories" className="text-zinc-700 hover:underline dark:text-zinc-300">
              カテゴリ
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

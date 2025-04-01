// app/layout.tsx (수정 없음)

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link"; // Link import는 유지
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coin Tracker", // 제목은 그대로 유지하거나 변경 가능
  description: "Track your favorite cryptocurrencies", // 설명 변경 가능
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko"> {/* 한국어 설정 유지 */}
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <header className="bg-white dark:bg-gray-800 shadow-md">
          <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
            {/* 홈 링크는 유지 */}
            <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              Coin Tracker
            </Link>
            {/* 다른 네비게이션 링크가 있다면 여기에 추가/수정 */}
            {/* 예: <Link href="/about">소개</Link> */}
          </nav>
        </header>
        {children} {/* 페이지 컨텐츠가 렌더링되는 부분 */}
        <footer className="text-center py-4 mt-8 text-gray-600 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()} Coin Tracker. All rights reserved.
        </footer>
      </body>
    </html>
  );
}

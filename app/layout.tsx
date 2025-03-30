import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";

export const metadata: Metadata = {
  title: "코인 시세 트래커",
  description: "빗썸 API를 활용한 코인 시세 분석 및 추적 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={GeistSans.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-blue-600 text-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <a href="/" className="text-2xl font-bold">코인 트래커</a>
              <nav>
                <ul className="flex space-x-4">
                  <li>
                    <a href="/" className="hover:underline">홈</a>
                  </li>
                  <li>
                    <a href="/favorites" className="hover:underline">즐겨찾기</a>
                  </li>
                  <li>
                    <a href="/add" className="hover:underline">코인 추가</a>
                  </li>
                </ul>
              </nav>
            </div>
          </header>
          
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          
          <footer className="bg-gray-200 mt-12">
            <div className="container mx-auto px-4 py-6">
              <p className="text-center text-gray-600 text-sm">
                © {new Date().getFullYear()} 코인 트래커. 빗썸 API를 활용한 비영리 프로젝트입니다.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

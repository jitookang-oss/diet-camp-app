import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "보라매직 12주 다이어트 캠프",
  description: "이보라 약사 @보라매직 | 대사관리 스코어 기반 맞춤 웰니스 프로그램",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

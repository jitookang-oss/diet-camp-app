import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "이지약국 12주 다이어트 캠프",
  description: "이보라 약사 @보라매직 | 3M 전략 기반 맞춤 웰니스 프로그램",
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

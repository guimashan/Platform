// src/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "龜馬山 goLine 平台",
  description: "龜馬山平台（LINE 登入 / 打卡 / 服務 / 排班）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
        {children}
      </body>
    </html>
  );
}

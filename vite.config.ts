// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import restApiPlugin from "./server/vite"; // ⬅️ 新增這行

export default defineConfig({
  plugins: [react(), restApiPlugin()], // ⬅️ 把插件加進來
  server: {
    host: true,
    port: 5175, // 你可保留 5175；被占用會自動跳 5176/5177
    allowedHosts: [
      // 你的 replit.dev 網域
      "6873acb1-8dc0-4d62-90d0-87b48ac21c44-00-qxr7tmv5xiyf.picard.replit.dev",
      ".replit.dev",
    ],
  },
  preview: {
    host: true,
    port: 5174,
  },
});
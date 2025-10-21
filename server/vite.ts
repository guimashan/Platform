// server/vite.ts
import type { PluginOption } from "vite";
import express from "express";
import { mountRoutes } from "./routes";

/**
 * 把 Express /api 路由接到 Vite 開發伺服器
 */
export default function restApiPlugin(): PluginOption {
  return {
    name: "rest-api-middleware",
    configureServer(vite) {
      const app = express();

      // 讓 Express 能讀 JSON
      app.use(express.json());

      // 掛上我們的 /api 路由
      mountRoutes(app);

      // 交給 Vite 的 connect 中介層
      vite.middlewares.use(app);
    },
  };
}
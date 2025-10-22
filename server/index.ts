// server/index.ts
import express, { Request, Response } from "express";
import { mountRoutes } from "./routes";

const app = express();

// ===== 基本中介層設定 =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== 健康檢查（主應用層）=====
app.get("/", (_req: Request, res: Response) => {
  res.send("龜馬山 goLine 平台伺服器運行中 ✅");
});

// ===== 掛上自訂路由（含 /api/ping-admin）=====
mountRoutes(app);

// ===== 啟動伺服器 =====
const PORT = process.env.PORT || 5175;
app.listen(PORT, () => {
  console.log(`🚀 Server 已啟動： http://localhost:${PORT}`);
  console.log(`🌐 Replit 公網網址：使用 Dev URL 或 .replit Ports 查看`);
});
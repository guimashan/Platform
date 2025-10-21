// server/routes.ts
import type { Express, Request, Response } from "express";
import { adminAuth } from "./firebaseAdmin";

export function mountRoutes(app: Express) {
  // 簡單健康檢查
  app.get("/api/ping", (_req: Request, res: Response) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // 測 Firebase Admin 是否能用
  app.get("/api/ping-admin", async (_req: Request, res: Response) => {
    try {
      // 這個呼叫需要 Service Account 權限；能成功就代表 Admin SDK OK
      const list = await adminAuth.listUsers(1);
      res.json({
        ok: true,
        adminReady: true,
        sampleUserCount: list.users.length,
        ts: Date.now(),
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        adminReady: false,
        error: err?.message ?? String(err),
      });
    }
  });
}
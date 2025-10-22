import type { Express, Request, Response } from "express";
import { verifyLineIdToken } from "./lib/line-login";
import { verifyLineSignature, replyMessage } from "./lib/line-bot";
import { KEYWORD_MAP } from "./keywords";
import { upsertRoleByKeyword } from "./services/roles";

/**
 * 統一路由掛載點：
 * - POST /api/auth/line  ：驗證 LIFF idToken
 * - POST /api/webhook    ：LINE Bot Webhook（簽章驗證 + 關鍵字處理 + 角色入庫）
 * - GET  /api/ping-bot   ：Bot 健康檢查
 * - GET  /api/admin/users?uid=<lineUserId>：查使用者文件
 */
export function mountRoutes(app: Express) {
  // 供簽章驗證的 raw 體
  app.use("/api/webhook", (req: Request, _res: Response, next) => {
    (req as any).__rawBody = JSON.stringify(req.body || {});
    next();
  });

  // 1) LINE Login：前端把 LIFF 拿到的 idToken POST 到這裡
  app.post("/api/auth/line", async (req: Request, res: Response) => {
    try {
      const { idToken, next } = req.body || {};
      if (!idToken) return res.status(400).json({ ok: false, error: "missing idToken" });

      const verified = await verifyLineIdToken(idToken);
      res.json({ ok: true, profile: verified, next: next || "/login" });
    } catch (err: any) {
      res.status(401).json({ ok: false, error: err?.message || String(err) });
    }
  });

  // 2) LINE Webhook：簽章驗證 → 關鍵字回覆 + 角色落地
  app.post("/api/webhook", async (req: Request, res: Response) => {
    try {
      const raw = (req as any).__rawBody || JSON.stringify(req.body || {});
      const sig = req.headers["x-line-signature"] as string | undefined;
      if (!verifyLineSignature(raw, sig)) return res.status(401).send("Bad signature");

      const body = req.body as any;
      const events = body?.events || [];

      for (const ev of events) {
        if (ev.type === "message" && ev.message?.type === "text") {
          const text: string = (ev.message.text || "").trim();
          const replyToken = ev.replyToken;
          const lineUserId: string | undefined = ev.source?.userId; // 這是 LINE 的 userId（非 Firebase uid）

          // 1) 固定回覆（網址）
          const hit = KEYWORD_MAP[text];
          const messages: any[] = [];
          if (hit?.text) messages.push({ type: "text", text: hit.text });
          if (hit?.url)  messages.push({ type: "text", text: hit.url });

          // 2) 角色寫入 Firestore
          if (lineUserId) {
            try {
              const result = await upsertRoleByKeyword({
                lineUserId,
                displayName: undefined, // 可在 M5 由 /profile 拉取
                pictureUrl: undefined,
                keyword: text,
              });
              // 附加系統回報（不暴露內部欄位）
              messages.push({ type: "text", text: `（系統）角色更新：${result.updated ? "OK" : "跳過"}，狀態：${result.status || "—"}` });
            } catch (e: any) {
              messages.push({ type: "text", text: `（系統）角色更新失敗：${e?.message || "unknown"}` });
            }
          } else {
            messages.push({ type: "text", text: "（系統）無法辨識您的 LINE 使用者 ID。" });
          }

          if (messages.length) {
            await replyMessage(replyToken, messages);
          }
        }
      }
      res.sendStatus(200);
    } catch (err: any) {
      console.error("[/api/webhook] error:", err?.message || err);
      res.sendStatus(200);
    }
  });

  // 3) Bot 健康檢查
  app.get("/api/ping-bot", (_req: Request, res: Response) => {
    const ok = !!(process.env.LINE_BOT_CHANNEL_ID && process.env.LINE_BOT_CHANNEL_SECRET && process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN);
    res.json({ ok, channelIdSet: !!process.env.LINE_BOT_CHANNEL_ID });
  });

  // 4) 後台查使用者（臨時管理查詢；日後可加權限）
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const uid = (req.query.uid as string | undefined) || "";
      if (!uid) return res.status(400).json({ ok: false, error: "missing uid" });
      // 以 LINE userId 搜尋
      const doc = await (await import("./firebaseAdmin")).adminDb.collection("users").doc(uid).get();
      if (!doc.exists) return res.status(404).json({ ok: false, error: "not_found" });
      res.json({ ok: true, data: doc.data() });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || "internal_error" });
    }
  });
}

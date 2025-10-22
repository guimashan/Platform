import type { Express, Request, Response } from "express";
import { verifyLineIdToken } from "./lib/verify-line";
import { verifyLineSignature, replyMessage } from "./lib/line-bot";
import { upsertRoleByKeyword } from "./services/roles";
import {
  triggerVercelDeployment,
  syncEnvToVercel,
  getVercelDomains,
  getLatestDeployment,
} from "./lib/vercel-deploy";

// 關鍵字對照表
const KEYWORD_MAP: Record<string, { text?: string; url?: string }> = {
  // 奉香系統（添加多種變體）
  "奉香註冊": { text: "已為您註冊奉香系統使用者權限", url: "https://go.guimashan.org.tw" },
  "奉香": { text: "已為您註冊奉香系統使用者權限", url: "https://go.guimashan.org.tw" },
  "奉香管理註冊": { text: "已為您註冊奉香系統管理權限", url: "https://go.guimashan.org.tw" },
  "奉香管理": { text: "已為您註冊奉香系統管理權限", url: "https://go.guimashan.org.tw" },
  "奉香系統註冊": { text: "已為您註冊奉香系統管理員權限", url: "https://go.guimashan.org.tw" },
  "奉香系統": { text: "已為您註冊奉香系統管理員權限", url: "https://go.guimashan.org.tw" },
  "奉香退場": { text: "已將您從奉香系統移除" },
  
  // 排班系統（添加多種變體）
  "志工註冊": { text: "已為您註冊排班系統志工權限", url: "https://go.guimashan.org.tw" },
  "志工": { text: "已為您註冊排班系統志工權限", url: "https://go.guimashan.org.tw" },
  "工作註冊": { text: "已為您註冊排班系統志工權限", url: "https://go.guimashan.org.tw" },
  "工作": { text: "已為您註冊排班系統志工權限", url: "https://go.guimashan.org.tw" },
  "排班管理註冊": { text: "已為您註冊排班系統管理權限", url: "https://go.guimashan.org.tw" },
  "排班管理": { text: "已為您註冊排班系統管理權限", url: "https://go.guimashan.org.tw" },
  "排班系統註冊": { text: "已為您註冊排班系統管理員權限", url: "https://go.guimashan.org.tw" },
  "排班系統": { text: "已為您註冊排班系統管理員權限", url: "https://go.guimashan.org.tw" },
  "排班退場": { text: "已將您從排班系統移除" },
  
  // 神務服務（添加多種變體）
  "神服服務": { text: "已為您註冊神務服務使用權限", url: "https://go.guimashan.org.tw" },
  "神服": { text: "已為您註冊神務服務使用權限", url: "https://go.guimashan.org.tw" },
  "神服管理註冊": { text: "已為您註冊神務服務管理權限", url: "https://go.guimashan.org.tw" },
  "神服管理": { text: "已為您註冊神務服務管理權限", url: "https://go.guimashan.org.tw" },
  "神服系統註冊": { text: "已為您註冊神務服務管理員權限", url: "https://go.guimashan.org.tw" },
  "神服系統": { text: "已為您註冊神務服務管理員權限", url: "https://go.guimashan.org.tw" },
  "神服退場": { text: "已將您從神務服務系統移除" },
};

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
  app.get("/api/ping-bot", async (_req: Request, res: Response) => {
    const { LINE_BOT_CHANNEL_ID, LINE_BOT_CHANNEL_SECRET, LINE_BOT_CHANNEL_ACCESS_TOKEN } = await import("./lib/line-bot");
    const ok = !!(LINE_BOT_CHANNEL_ID && LINE_BOT_CHANNEL_SECRET && LINE_BOT_CHANNEL_ACCESS_TOKEN);
    res.json({ ok, channelIdSet: !!LINE_BOT_CHANNEL_ID });
  });

  // 4) 後台查使用者（臨時管理查詢；日後可加權限）
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const uid = (req.query.uid as string | undefined) || "";
      if (!uid) return res.status(400).json({ ok: false, error: "missing uid" });
      // 以 LINE userId 搜尋
      const doc = await (await import("./lib/firebase-admin")).adminDb.collection("users").doc(uid).get();
      if (!doc.exists) return res.status(404).json({ ok: false, error: "not_found" });
      res.json({ ok: true, data: doc.data() });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || "internal_error" });
    }
  });

  // 5) Vercel 部署管理 API
  // 認證中間件：保護部署管理端點
  const verifyDeployAuth = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    const adminKey = process.env.VERCEL_ADMIN_API_KEY;
    
    // 防止配置錯誤：如果 adminKey 未設定，拒絕所有請求
    if (!adminKey) {
      return res.status(500).json({ 
        ok: false, 
        error: "伺服器配置錯誤：VERCEL_ADMIN_API_KEY 未設定" 
      });
    }
    
    // 檢查是否提供了正確的 admin key
    if (!authHeader || authHeader !== `Bearer ${adminKey}`) {
      return res.status(401).json({ 
        ok: false, 
        error: "未授權：需要 VERCEL_ADMIN_API_KEY 認證" 
      });
    }
    
    next();
  };
  
  // 觸發部署
  app.post("/api/deploy/trigger", verifyDeployAuth, async (_req: Request, res: Response) => {
    try {
      const result = await triggerVercelDeployment();
      res.json({
        ok: true,
        job: result.job,
        message: result.message,
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  });

  // 同步環境變數到 Vercel
  app.post("/api/deploy/sync-env", verifyDeployAuth, async (req: Request, res: Response) => {
    try {
      const envVars = req.body || {};
      if (!Object.keys(envVars).length) {
        return res.status(400).json({ ok: false, error: "沒有提供環境變數" });
      }
      
      const result = await syncEnvToVercel(envVars);
      res.json({ 
        ok: true, 
        message: "環境變數同步成功", 
        created: result.created,
        updated: result.updated,
        total: Object.keys(envVars).length 
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  });

  // 取得 Vercel 域名
  app.get("/api/deploy/domains", async (_req: Request, res: Response) => {
    try {
      const domains = await getVercelDomains();
      res.json({ ok: true, domains });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  });

  // 取得最新部署狀態
  app.get("/api/deploy/status", async (_req: Request, res: Response) => {
    try {
      const deployment = await getLatestDeployment();
      res.json({ ok: true, deployment });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  });

  // 一鍵部署：同步環境變數 + 觸發部署
  app.post("/api/deploy/full", verifyDeployAuth, async (_req: Request, res: Response) => {
    try {
      // 收集需要同步的環境變數
      const envVarsToSync: Record<string, string> = {};
      
      // Firebase 環境變數
      const firebaseVars = [
        "FIREBASE_SERVICE_ACCOUNT_JSON",
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
        "NEXT_PUBLIC_FIREBASE_APP_ID",
      ];
      
      // LINE 環境變數
      const lineVars = [
        "LINE_BOT_CHANNEL_ID",
        "LINE_BOT_CHANNEL_SECRET",
        "LINE_BOT_CHANNEL_ACCESS_TOKEN",
        "LINE_CHANNEL_ID",
        "LINE_CHANNEL_SECRET",
        "NEXT_PUBLIC_LINE_LIFF_ID",
      ];
      
      // Session 環境變數
      const sessionVars = ["SESSION_SECRET"];
      
      const allVars = [...firebaseVars, ...lineVars, ...sessionVars];
      
      for (const key of allVars) {
        const value = process.env[key];
        if (value) {
          envVarsToSync[key] = value;
        }
      }
      
      // 同步環境變數
      const syncResult = await syncEnvToVercel(envVarsToSync);
      
      // 觸發部署
      const deployment = await triggerVercelDeployment();
      
      res.json({
        ok: true,
        message: "環境變數同步完成，部署已觸發",
        sync: {
          created: syncResult.created,
          updated: syncResult.updated,
          total: Object.keys(envVarsToSync).length,
        },
        deployment: {
          job: deployment.job,
          message: deployment.message,
        },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  });
}

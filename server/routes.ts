import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminAuth } from "./lib/firebase-admin";
import { verifyLineIdToken } from "./lib/verify-line";
import { 
  lineAuthPayloadSchema, 
  insertCheckinSchema,
  updateCheckinSchema,
  insertServiceSchema,
  updateServiceSchema,
  insertScheduleSchema,
  updateScheduleSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ==================== LINE 認證 API ====================
  app.post("/api/auth/line", async (req, res) => {
    const startedAt = Date.now();
    
    try {
      // 驗證請求 body
      const parseResult = lineAuthPayloadSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_REQUEST_BODY",
          details: parseResult.error.issues,
        });
      }

      const { idToken } = parseResult.data;

      // 驗證 LINE ID Token
      const payload = await verifyLineIdToken(idToken);
      const aud = payload.aud;
      const expected = process.env.LINE_CHANNEL_ID;
      
      if (expected && aud && aud !== expected) {
        return res.status(400).json({
          ok: false,
          error: "AUD_MISMATCH",
          detail: { aud, expected },
        });
      }

      const sub = payload.sub;
      if (!sub) {
        return res.status(400).json({
          ok: false,
          error: "MISSING_SUB",
        });
      }

      // 建立或更新使用者
      let user = await storage.getUser(sub);
      if (!user) {
        user = await storage.createUser({
          id: sub,
          displayName: payload.name || `LINE User ${sub.slice(0, 8)}`,
          pictureUrl: payload.picture,
          email: payload.email,
        });
      }

      // 產生 Firebase Custom Token
      const customToken = await adminAuth.createCustomToken(sub);

      // 返回成功響應
      return res.status(200).json({
        ok: true,
        customToken,
        userId: sub,
        tookMs: Date.now() - startedAt,
      });
    } catch (err: any) {
      console.error("[/api/auth/line] ERROR:", {
        message: err?.message,
        stack: err?.stack,
      });
      
      return res.status(500).json({
        ok: false,
        error: "INTERNAL_ERROR",
        detail: err?.message || String(err),
      });
    }
  });

  // ==================== 簽到 API ====================
  app.get("/api/checkins", async (_req, res) => {
    try {
      const checkins = await storage.getCheckins();
      res.json(checkins);
    } catch (error: any) {
      console.error("[/api/checkins] GET ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/checkins/:id", async (req, res) => {
    try {
      const checkin = await storage.getCheckin(req.params.id);
      if (!checkin) {
        return res.status(404).json({ error: "簽到記錄不存在" });
      }
      res.json(checkin);
    } catch (error: any) {
      console.error("[/api/checkins/:id] GET ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/checkins", async (req, res) => {
    try {
      const parseResult = insertCheckinSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "無效的請求資料",
          details: parseResult.error.issues,
        });
      }

      const checkin = await storage.createCheckin(parseResult.data);
      res.status(201).json(checkin);
    } catch (error: any) {
      console.error("[/api/checkins] POST ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/checkins/:id", async (req, res) => {
    try {
      const parseResult = updateCheckinSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "無效的請求資料",
          details: parseResult.error.issues,
        });
      }

      const checkin = await storage.updateCheckin(req.params.id, parseResult.data);
      if (!checkin) {
        return res.status(404).json({ error: "簽到記錄不存在" });
      }
      res.json(checkin);
    } catch (error: any) {
      console.error("[/api/checkins/:id] PUT ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/checkins/:id", async (req, res) => {
    try {
      const success = await storage.deleteCheckin(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "簽到記錄不存在" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("[/api/checkins/:id] DELETE ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 服務 API ====================
  app.get("/api/services", async (_req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error: any) {
      console.error("[/api/services] GET ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ error: "服務申請不存在" });
      }
      res.json(service);
    } catch (error: any) {
      console.error("[/api/services/:id] GET ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const parseResult = insertServiceSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "無效的請求資料",
          details: parseResult.error.issues,
        });
      }

      const service = await storage.createService(parseResult.data);
      res.status(201).json(service);
    } catch (error: any) {
      console.error("[/api/services] POST ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const parseResult = updateServiceSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "無效的請求資料",
          details: parseResult.error.issues,
        });
      }

      const service = await storage.updateService(req.params.id, parseResult.data);
      if (!service) {
        return res.status(404).json({ error: "服務申請不存在" });
      }
      res.json(service);
    } catch (error: any) {
      console.error("[/api/services/:id] PUT ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const success = await storage.deleteService(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "服務申請不存在" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("[/api/services/:id] DELETE ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== 排班 API ====================
  app.get("/api/schedules", async (_req, res) => {
    try {
      const schedules = await storage.getSchedules();
      res.json(schedules);
    } catch (error: any) {
      console.error("[/api/schedules] GET ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.getSchedule(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: "排班記錄不存在" });
      }
      res.json(schedule);
    } catch (error: any) {
      console.error("[/api/schedules/:id] GET ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const parseResult = insertScheduleSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "無效的請求資料",
          details: parseResult.error.issues,
        });
      }

      const schedule = await storage.createSchedule(parseResult.data);
      res.status(201).json(schedule);
    } catch (error: any) {
      console.error("[/api/schedules] POST ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/schedules/:id", async (req, res) => {
    try {
      const parseResult = updateScheduleSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "無效的請求資料",
          details: parseResult.error.issues,
        });
      }

      const schedule = await storage.updateSchedule(req.params.id, parseResult.data);
      if (!schedule) {
        return res.status(404).json({ error: "排班記錄不存在" });
      }
      res.json(schedule);
    } catch (error: any) {
      console.error("[/api/schedules/:id] PUT ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const success = await storage.deleteSchedule(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "排班記錄不存在" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("[/api/schedules/:id] DELETE ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

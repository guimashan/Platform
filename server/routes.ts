import type { Express } from "express";
import { adminAuth, adminProjectId } from "./lib/firebase-admin";

export function mountRoutes(app: Express) {
  app.get("/api/ping-admin", (_req, res) => {
    res.json({
      ok: true,
      projectId: adminProjectId,
      hasAdminAuth: !!adminAuth,
      hasAdminDb: true,
    });
  });
}
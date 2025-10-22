// src/lib/admin.ts
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type ServiceAccountShape = {
  project_id: string;
  client_email: string;
  private_key: string;
  [k: string]: unknown;
};

function loadServiceAccountFromEnv(): ServiceAccountShape {
  const key = "FIREBASE_SERVICE_ACCOUNT_JSON";
  let raw = process.env[key];
  if (!raw) {
    throw new Error(`[${key}] is missing. Please set it in Vercel → Settings → Environment Variables.`);
  }

  raw = raw.trim();

  // 允許 Base64（有些人會把整包 JSON 先 Base64 再貼）
  let text = raw;
  if (!raw.startsWith("{")) {
    try {
      text = Buffer.from(raw, "base64").toString("utf8");
      if (!text.startsWith("{")) {
        throw new Error("Base64 decoded content is not JSON.");
      }
    } catch (e) {
      throw new Error(`[${key}] looks like Base64 but cannot be decoded to JSON: ${(e as Error).message}`);
    }
  }

  // 解析 JSON
  let svc: ServiceAccountShape;
  try {
    svc = JSON.parse(text) as ServiceAccountShape;
  } catch (e) {
    throw new Error(`[${key}] is not valid JSON: ${(e as Error).message}`);
  }

  // 把字面 \\n 換成真正換行，並清掉 CRLF
  if (typeof svc.private_key === "string") {
    svc.private_key = svc.private_key.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
  }

  // 基本欄位檢查
  if (!svc.project_id || !svc.client_email || !svc.private_key) {
    throw new Error(
      `[${key}] is missing required fields (project_id/client_email/private_key).`
    );
  }

  return svc;
}

// 單例初始化 firebase-admin
let adminApp: App;
if (!getApps().length) {
  const svc = loadServiceAccountFromEnv();
  adminApp = initializeApp({
    credential: cert({
      projectId: svc.project_id,
      clientEmail: svc.client_email,
      privateKey: svc.private_key,
    }),
  });
} else {
  adminApp = getApps()[0]!;
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

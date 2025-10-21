import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function loadServiceAccount() {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.warn("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON 未設定");
    return null;
  }

  raw = raw.trim();

  // 支援 Base64（Replit 有時自動編碼）
  if (!raw.startsWith("{")) {
    try {
      raw = Buffer.from(raw, "base64").toString("utf8");
    } catch (e) {
      console.error("[firebase-admin] Base64 decode 失敗", e);
      return null;
    }
  }

  try {
    const json = JSON.parse(raw);
    return json;
  } catch (e) {
    console.error("[firebase-admin] JSON parse 失敗", e);
    return null;
  }
}

const svc = loadServiceAccount();

const projectId =
  svc?.project_id ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "platform-bc783"; // 預設補值

let app;
if (!getApps().length) {
  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail: svc?.client_email,
      privateKey: svc?.private_key,
    }),
  });
  console.log("✅ Firebase Admin SDK 已初始化");
} else {
  app = getApp();
}

export const adminAuth = getAuth(app);
export const adminApp = app;
export const adminProjectId = projectId;
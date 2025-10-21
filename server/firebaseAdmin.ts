import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

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
    throw new Error(`環境變數 ${key} 未設定。請在 Replit Secrets 中設定 Firebase Service Account JSON。`);
  }

  raw = raw.trim();

  // 支援 Base64 編碼的 JSON
  let text = raw;
  if (!raw.startsWith("{")) {
    try {
      text = Buffer.from(raw, "base64").toString("utf8");
      if (!text.startsWith("{")) {
        throw new Error("Base64 解碼後的內容不是有效的 JSON。");
      }
    } catch (e) {
      throw new Error(`${key} 看起來像 Base64 但無法解碼為 JSON: ${(e as Error).message}`);
    }
  }

  // 解析 JSON
  let svc: ServiceAccountShape;
  try {
    svc = JSON.parse(text) as ServiceAccountShape;
  } catch (e) {
    throw new Error(`${key} 不是有效的 JSON: ${(e as Error).message}`);
  }

  // 處理 private_key 中的換行符號
  if (typeof svc.private_key === "string") {
    svc.private_key = svc.private_key
      .replace(/\\n/g, "\n")
      .replace(/\r\n/g, "\n");
  }

  // 檢查必要欄位
  if (!svc.project_id || !svc.client_email || !svc.private_key) {
    throw new Error(
      `${key} 缺少必要欄位 (project_id/client_email/private_key)。`
    );
  }

  return svc;
}

// 單例初始化 firebase-admin
let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

try {
  if (!getApps().length) {
    const svc = loadServiceAccountFromEnv();
    adminApp = initializeApp({
      credential: cert({
        projectId: svc.project_id,
        clientEmail: svc.client_email,
        privateKey: svc.private_key,
      }),
    });
    console.log("✓ Firebase Admin SDK 初始化成功");
  } else {
    adminApp = getApps()[0]!;
  }
  
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
} catch (error) {
  console.error("✗ Firebase Admin SDK 初始化失敗:", error);
  throw error;
}

export { adminApp, adminAuth, adminDb };

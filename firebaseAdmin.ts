// server/firebaseAdmin.ts
import admin from "firebase-admin";

let app: admin.app.App | undefined;

export function getAdminApp() {
  if (app) return app;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "[firebaseAdmin] Missing FIREBASE_SERVICE_ACCOUNT_JSON. " +
        "請在 .env 貼上一行壓縮的 Service Account JSON。"
    );
  }

  let serviceAccount: admin.ServiceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      "[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_JSON 無法 JSON.parse；請確認沒有多餘換行或少引號。"
    );
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // 可有可無：僅當你有用到 Realtime DB 或自定 storage bucket 時
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    });
  } catch (e: any) {
    // 在熱重載或多次載入時，initializeApp 可能丟錯；我們抓訊息判斷是否重用
    if (e?.message?.includes("already exists")) {
      app = admin.app();
    } else {
      throw e;
    }
  }
  return app!;
}

export const adminAuth = () => getAdminApp().auth();
export const adminDb = () => getAdminApp().firestore();
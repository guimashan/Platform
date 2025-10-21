// server/firebaseAdmin.ts
import admin from "firebase-admin";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "";

if (!raw) {
  throw new Error(
    "[firebaseAdmin] Missing FIREBASE_SERVICE_ACCOUNT_JSON. 請在 .env 貼上 Service Account JSON"
  );
}

const serviceAccount = JSON.parse(raw);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminApp = admin;
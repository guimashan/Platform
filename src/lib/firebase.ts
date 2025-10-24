// src/lib/firebase.ts
// 業務層：checkin-76c77（奉香簽到系統）
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_CHECKIN_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_CHECKIN_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_CHECKIN_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_CHECKIN_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_CHECKIN_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_CHECKIN_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// 導出給前端登入用
export const authClient = getAuth(app);

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const platformConfig = {
  apiKey: process.env.NEXT_PUBLIC_PLATFORM_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_PLATFORM_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PLATFORM_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_PLATFORM_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_PLATFORM_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_PLATFORM_FIREBASE_APP_ID,
};

const platformApp = getApps().find(app => app.name === 'platform') || initializeApp(platformConfig, 'platform');

export const platformAuth = getAuth(platformApp);
export const platformDb = getFirestore(platformApp);
export { platformApp };

import admin from "firebase-admin";

let platformAdminApp: admin.app.App;

export function getPlatformAdmin() {
  if (!platformAdminApp) {
    const serviceAccount = process.env.PLATFORM_SERVICE_ACCOUNT_JSON;
    if (!serviceAccount) {
      throw new Error("PLATFORM_SERVICE_ACCOUNT_JSON not found");
    }

    try {
      platformAdminApp = admin.apps.find(app => app?.name === 'platform-admin') || admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      }, 'platform-admin');
    } catch (error) {
      console.error("Failed to initialize Platform Firebase Admin:", error);
      throw error;
    }
  }
  return platformAdminApp;
}

export const platformAdminDb = () => getPlatformAdmin().firestore();
export const platformAdminAuth = () => getPlatformAdmin().auth();

import admin from "firebase-admin";

let checkinAdminApp: admin.app.App;

export function getCheckinAdmin() {
  if (!checkinAdminApp) {
    const serviceAccount = process.env.CHECKIN_SERVICE_ACCOUNT_JSON;
    if (!serviceAccount) {
      throw new Error("CHECKIN_SERVICE_ACCOUNT_JSON not found");
    }

    try {
      checkinAdminApp = admin.apps.find(app => app?.name === 'checkin-admin') || admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      }, 'checkin-admin');
    } catch (error) {
      console.error("Failed to initialize Checkin Firebase Admin:", error);
      throw error;
    }
  }
  return checkinAdminApp;
}

export const checkinAdminDb = () => getCheckinAdmin().firestore();

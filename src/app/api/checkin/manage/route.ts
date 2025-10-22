import { getApps, cert, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}")) })
const db = getFirestore()
export async function GET() {
  const snap = await db.collection("checkins").orderBy("time", "desc").limit(20).get()
  const data = snap.docs.map(d => d.data())
  return Response.json({ ok: true, data })
}

import { NextRequest } from "next/server"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}")) })
const db = getFirestore()

export async function POST(req: NextRequest) {
  const body = await req.json()
  const record = { userId: body.userId, name: body.name, time: new Date().toISOString() }
  await db.collection("checkins").add(record)
  return Response.json({ ok: true, message: "奉香簽到完成", record })
}

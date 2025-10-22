import crypto from "crypto"
import { NextRequest } from "next/server"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const CHANNEL_SECRET = process.env.LINE_BOT_CHANNEL_SECRET || ""
const FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}"

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON)) })
}
const db = getFirestore()

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("x-line-signature") || ""

  const expected = crypto
    .createHmac("sha256", CHANNEL_SECRET)
    .update(body)
    .digest("base64")

  if (signature !== expected) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid signature" }),
      { status: 401 }
    )
  }

  const data = JSON.parse(body)
  const event = data.events?.[0]
  const userId = event?.source?.userId || "unknown"

  await db.collection("webhook_logs").add({
    receivedAt: new Date().toISOString(),
    userId,
    event,
  })

  return new Response(JSON.stringify({ ok: true, userId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

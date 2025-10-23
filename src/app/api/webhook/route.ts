// src/app/api/webhook/route.ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

// 關鍵字對照表
const KEYWORDS: Record<string, string> = {
  "奉香簽到": "https://go.guimashan.org.tw/checkin",
  "志工排班": "https://go.guimashan.org.tw/schedule",
  "神務服務": "https://go.guimashan.org.tw/service",
  "服務申請": "https://go.guimashan.org.tw/service",
  "首頁": "https://go.guimashan.org.tw",
  "幫助": "請輸入：奉香簽到、志工排班、神務服務",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    // 驗證簽章
    if (CHANNEL_SECRET) {
      const expected = crypto
        .createHmac("sha256", CHANNEL_SECRET)
        .update(body)
        .digest("base64");

      if (signature !== expected) {
        console.error("[webhook] Invalid signature");
        return NextResponse.json(
          { ok: false, error: "INVALID_SIGNATURE" },
          { status: 401 }
        );
      }
    }

    const data = JSON.parse(body);
    const events = data.events || [];

    for (const event of events) {
      const userId = event?.source?.userId || "unknown";
      const eventType = event?.type;

      // 記錄到 Firestore
      try {
        await adminDb.collection("webhook_logs").add({
          receivedAt: new Date().toISOString(),
          userId,
          eventType,
          event,
        });
      } catch (err) {
        console.error("[webhook] Failed to log to Firestore:", err);
      }

      // 處理文字訊息 - 關鍵字回覆
      if (eventType === "message" && event.message?.type === "text") {
        const messageText = event.message.text?.trim() || "";
        const replyToken = event.replyToken;

        // 查找關鍵字
        let responseText = "";
        for (const [keyword, response] of Object.entries(KEYWORDS)) {
          if (messageText.includes(keyword)) {
            responseText = response;
            break;
          }
        }

        // 如果有配對到關鍵字，且有 Access Token，則回覆
        if (responseText && replyToken && ACCESS_TOKEN) {
          try {
            const replyPayload = {
              replyToken,
              messages: [
                {
                  type: "text",
                  text: responseText,
                },
              ],
            };

            const lineResponse = await fetch(
              "https://api.line.me/v2/bot/message/reply",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
                body: JSON.stringify(replyPayload),
              }
            );

            if (!lineResponse.ok) {
              const errorText = await lineResponse.text();
              console.error(
                "[webhook] LINE reply failed:",
                lineResponse.status,
                errorText
              );
            } else {
              console.log(
                `[webhook] Replied to user ${userId} with keyword: ${messageText}`
              );
            }
          } catch (err) {
            console.error("[webhook] Failed to send reply:", err);
          }
        } else if (responseText && !ACCESS_TOKEN) {
          console.warn(
            "[webhook] Would reply but LINE_CHANNEL_ACCESS_TOKEN is not set"
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[webhook] ERROR:", err?.message);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "METHOD_NOT_ALLOWED", hint: "Webhook expects POST from LINE" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

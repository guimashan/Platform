// /src/app/api/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 你剛剛在 Vercel 設的三個環境變數
const CHANNEL_SECRET = process.env.LINE_BOT_CHANNEL_SECRET!;
const ACCESS_TOKEN   = process.env.LINE_BOT_ACCESS_TOKEN!;

export async function POST(req: Request) {
  // 1) 讀原始字串做簽章驗證（很重要：不能先 json()）
  const bodyText = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  const hmac = crypto.createHmac("sha256", CHANNEL_SECRET)
                     .update(bodyText)
                     .digest("base64");

  if (hmac !== signature) {
    // 簽章不通過：回 401 讓 LINE 知道不要重送
    return new NextResponse("Invalid signature", { status: 401 });
  }

  // 2) 驗證通過，再安全地 parse
  const body = JSON.parse(bodyText) as {
    events?: Array<{
      type: string;
      replyToken?: string;
      message?: { type: string; text?: string };
    }>;
  };

  // 3)（可選）簡單回覆文字：只處理文字訊息
  const events = body.events ?? [];
  for (const ev of events) {
    if (ev.type === "message" && ev.message?.type === "text" && ev.replyToken) {
      // 回覆「收到：<使用者文字>」
      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          replyToken: ev.replyToken,
          messages: [{ type: "text", text: `收到：${ev.message.text || ""}` }],
        }),
      }).catch(() => {}); // 不讓回覆失敗影響 200
    }
  }

  // 4) 一定要快速回 200，代表有收到
  return NextResponse.json({ ok: true });
}

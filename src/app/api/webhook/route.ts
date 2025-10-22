// /src/app/api/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔐 從環境變數讀取（不會洩漏）
const CHANNEL_SECRET = process.env.LINE_BOT_CHANNEL_SECRET!;
const ACCESS_TOKEN = process.env.LINE_BOT_ACCESS_TOKEN!;

export async function POST(req: Request) {
  try {
    // 1) 讀原始字串做簽章驗證
    const bodyText = await req.text();
    const signature = req.headers.get("x-line-signature") ?? "";

    // 🔐 驗證簽章（CHANNEL_SECRET 不會被洩漏）
    const hmac = crypto.createHmac("sha256", CHANNEL_SECRET)
                       .update(bodyText)
                       .digest("base64");

    if (hmac !== signature) {
      // 簽章不通過：只返回通用錯誤訊息
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2) 驗證通過，解析 body
    const body = JSON.parse(bodyText) as {
      events?: Array<{
        type: string;
        replyToken?: string;
        message?: { type: string; text?: string };
      }>;
    };

    // 3) 處理文字訊息
    const events = body.events ?? [];
    for (const ev of events) {
      if (ev.type === "message" && ev.message?.type === "text" && ev.replyToken) {
        // 🔐 ACCESS_TOKEN 只在 Authorization header 使用，不會洩漏
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
        }).catch(() => {}); // 靜默處理錯誤，不洩漏資訊
      }
    }

    // 4) 返回成功（不包含任何機密資訊）
    return NextResponse.json({ ok: true });
  } catch (err) {
    // 🔐 只記錄到伺服器，不返回詳細錯誤
    console.error("[webhook] Error processing request");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

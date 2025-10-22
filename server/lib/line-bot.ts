import crypto from "crypto";

export const LINE_BOT_CHANNEL_ID = process.env.LINE_BOT_CHANNEL_ID || process.env.LINE_CHANNEL_ID || "";
export const LINE_BOT_CHANNEL_SECRET = process.env.LINE_BOT_CHANNEL_SECRET || process.env.LINE_CHANNEL_SECRET || "";
export const LINE_BOT_CHANNEL_ACCESS_TOKEN = process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN || process.env.LINE_BOT_ACCESS_TOKEN || "";
export const LINE_BOT_WEBHOOK_URL = process.env.LINE_BOT_WEBHOOK_URL || "";

/**
 * 驗證 LINE Webhook 簽章
 */
export function verifyLineSignature(body: string, signature: string | undefined): boolean {
  if (!signature || !LINE_BOT_CHANNEL_SECRET) return false;
  
  const hash = crypto
    .createHmac("sha256", LINE_BOT_CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  
  return hash === signature;
}

/**
 * 回覆訊息到 LINE
 */
export async function replyMessage(replyToken: string, messages: any[]): Promise<void> {
  if (!LINE_BOT_CHANNEL_ACCESS_TOKEN) {
    console.warn("[LINE Bot] No access token, skipping reply");
    return;
  }

  const url = "https://api.line.me/v2/bot/message/reply";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_BOT_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[LINE Bot] Reply failed: ${res.status} - ${text}`);
    throw new Error(`LINE reply failed: ${res.status}`);
  }
}

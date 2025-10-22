export const LINE_BOT_CHANNEL_ID = process.env.LINE_BOT_CHANNEL_ID!;
export const LINE_BOT_CHANNEL_SECRET = process.env.LINE_BOT_CHANNEL_SECRET!;
export const LINE_BOT_CHANNEL_ACCESS_TOKEN = process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN!;
export const LINE_BOT_WEBHOOK_URL = process.env.LINE_BOT_WEBHOOK_URL || "";

if (!LINE_BOT_CHANNEL_ID || !LINE_BOT_CHANNEL_SECRET || !LINE_BOT_CHANNEL_ACCESS_TOKEN) {
  throw new Error("[LINE Bot] Missing environment variables");
}

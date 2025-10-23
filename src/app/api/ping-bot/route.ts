// src/app/api/ping-bot/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date().toISOString();
  
  // 檢查環境變數配置
  const hasChannelId = !!process.env.LINE_CHANNEL_ID;
  const hasChannelSecret = !!process.env.LINE_CHANNEL_SECRET;
  const hasAccessToken = !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const hasLiffId = !!process.env.NEXT_PUBLIC_LINE_LIFF_ID;

  const allConfigured = hasChannelId && hasChannelSecret && hasAccessToken && hasLiffId;

  return NextResponse.json({
    ok: true,
    service: "龜馬山 goLine 平台",
    endpoint: "ping-bot",
    status: allConfigured ? "ready" : "incomplete_config",
    timestamp: now,
    env: {
      channelId: hasChannelId,
      channelSecret: hasChannelSecret,
      accessToken: hasAccessToken,
      liffId: hasLiffId,
    },
    features: {
      webhookSignatureValidation: hasChannelSecret,
      keywordAutoReply: hasAccessToken,
      liffAuth: hasLiffId,
    }
  });
}

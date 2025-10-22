import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 檢查 LINE Bot 相關環境變數
    const envChecks = {
      channelId: !!process.env.LINE_BOT_CHANNEL_ID,
      channelSecret: !!process.env.LINE_BOT_CHANNEL_SECRET,
      accessToken: !!process.env.LINE_BOT_ACCESS_TOKEN
    };

    // 檢查 LINE Messaging API 連線
    let lineApiHealthy = false;
    const accessToken = process.env.LINE_BOT_ACCESS_TOKEN;
    
    if (accessToken) {
      try {
        // 測試 LINE Messaging API（取得 Bot Info）
        const response = await fetch('https://api.line.me/v2/bot/info', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        lineApiHealthy = response.ok;
      } catch (err) {
        console.error('[ping-bot] LINE API check failed:', err);
        lineApiHealthy = false;
      }
    }

    const allHealthy = Object.values(envChecks).every(v => v === true) && lineApiHealthy;

    return NextResponse.json({
      ok: allHealthy,
      timestamp: new Date().toISOString(),
      env: envChecks,
      services: {
        lineMessagingApi: lineApiHealthy
      }
    }, {
      status: allHealthy ? 200 : 503
    });
  } catch (err: any) {
    console.error('[ping-bot] Unexpected error:', err?.message);
    
    return NextResponse.json({
      ok: false,
      error: 'Bot health check failed',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}

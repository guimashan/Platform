// 最小化測試：直接調用 LINE token API 並返回原始響應
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code') || 'test_code';
    
    const channelId = process.env.LINE_CHANNEL_ID!;
    const channelSecret = process.env.LINE_CHANNEL_SECRET!;
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/line-oauth/callback`;
    
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: callbackUrl,
      client_id: channelId,
      client_secret: channelSecret,
    });
    
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });
    
    const responseText = await tokenResponse.text();
    
    // 返回原始響應的診斷信息
    return NextResponse.json({
      status: tokenResponse.status,
      responseLength: responseText.length,
      position158Char: responseText.length > 158 ? responseText.charCodeAt(158) : null,
      position158Context: responseText.length > 158 ? 
        Array.from(responseText.substring(150, 170)).map((c, i) => ({
          pos: 150 + i,
          char: c,
          code: c.charCodeAt(0)
        })) : [],
      rawResponse: responseText,
      canParseDirectly: (() => {
        try {
          JSON.parse(responseText);
          return true;
        } catch {
          return false;
        }
      })(),
      canParseAfterClean: (() => {
        try {
          const cleaned = responseText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
          JSON.parse(cleaned);
          return true;
        } catch {
          return false;
        }
      })()
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// src/app/api/auth/line-oauth/authorize/route.ts
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const channelId = process.env.LINE_CHANNEL_ID;
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://go.guimashan.org.tw'}/api/auth/line-oauth/callback`;
    const sessionSecret = process.env.SESSION_SECRET;
    
    if (!channelId || !sessionSecret) {
      return NextResponse.json(
        { ok: false, error: "LINE_CHANNEL_ID or SESSION_SECRET not configured" },
        { status: 500 }
      );
    }

    // 生成 state 和 nonce
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    
    // 使用 JWT 簽名 state 和 nonce，並存入 HTTP-only cookie
    const secret = new TextEncoder().encode(sessionSecret);
    const token = await new SignJWT({ state, nonce })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('10m')
      .sign(secret);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: channelId,
      redirect_uri: callbackUrl,
      state: state,
      scope: 'profile openid email',
      nonce: nonce,
    });

    const authorizeUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;

    // 設置 HTTP-only cookie 並重定向
    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set('line_oauth_state', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10 分鐘
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("LINE OAuth authorize error:", error);
    return NextResponse.json(
      { ok: false, error: "Authorization failed" },
      { status: 500 }
    );
  }
}

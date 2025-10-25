// src/app/api/auth/line-oauth/callback/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { platformAdminAuth, platformAdminDb } from "@/lib/admin-platform";
import { verifyLineIdToken } from "@/lib/verifyLineIdToken";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const returnedState = searchParams.get('state');
    const error = searchParams.get('error');

    // 檢查是否有錯誤
    if (error) {
      return NextResponse.redirect(
        new URL(`/admin/login?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code || !returnedState) {
      return NextResponse.redirect(
        new URL('/admin/login?error=no_code', req.url)
      );
    }

    // 1. 驗證 state (CSRF 防護)
    const stateCookie = req.headers.get('cookie')?.split('; ')
      .find(c => c.startsWith('line_oauth_state='))
      ?.split('=')[1];

    if (!stateCookie) {
      return NextResponse.redirect(
        new URL('/admin/login?error=no_state_cookie', req.url)
      );
    }

    const sessionSecret = process.env.SESSION_SECRET;
    const channelId = process.env.LINE_CHANNEL_ID;
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    
    if (!sessionSecret || !channelId || !channelSecret) {
      return NextResponse.redirect(
        new URL('/admin/login?error=config_error', req.url)
      );
    }

    const secret = new TextEncoder().encode(sessionSecret);
    let stateData: { state: string; nonce: string };
    
    try {
      const { payload } = await jwtVerify(stateCookie, secret);
      stateData = payload as { state: string; nonce: string };
    } catch (err) {
      console.error('State verification failed:', err);
      return NextResponse.redirect(
        new URL('/admin/login?error=invalid_state', req.url)
      );
    }

    if (stateData.state !== returnedState) {
      return NextResponse.redirect(
        new URL('/admin/login?error=state_mismatch', req.url)
      );
    }

    // 2. 用 code 換取 access token
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://go.guimashan.org.tw'}/api/auth/line-oauth/callback`;

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

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL('/admin/login?error=token_exchange_failed', req.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    if (!accessToken || !idToken) {
      return NextResponse.redirect(
        new URL('/admin/login?error=no_tokens', req.url)
      );
    }

    // 3. 取得用戶資料（使用 Profile API）
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(
        new URL('/admin/login?error=profile_fetch_failed', req.url)
      );
    }

    const profile = await profileResponse.json();
    const lineUserId = profile.userId;
    const displayName = profile.displayName;
    const pictureUrl = profile.pictureUrl;

    // 4. 完整驗證 ID Token（簽名 + nonce）
    let email: string;
    try {
      const verifiedPayload = await verifyLineIdToken(
        idToken,
        stateData.nonce,
        channelId
      );
      
      // 暫時：如果沒有 email，使用 LINE User ID 作為替代
      email = verifiedPayload.email || `${lineUserId}@line.local`;
      
      if (!verifiedPayload.email) {
        console.warn(`⚠️  LINE User ${lineUserId} 沒有 email，使用替代 email: ${email}`);
      }
    } catch (err) {
      console.error('ID token verification failed:', err);
      // 暫時：將詳細錯誤訊息返回給前端（僅用於診斷）
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorDetail = encodeURIComponent(errorMessage.substring(0, 200));
      return NextResponse.redirect(
        new URL(`/admin/login?error=id_token_verification_failed&detail=${errorDetail}`, req.url)
      );
    }

    // 5. Email 檢查（暫時允許替代 email）
    if (!email) {
      return NextResponse.redirect(
        new URL('/admin/login?error=no_email', req.url)
      );
    }

    // 6. 在 platform-bc783 查找或建立使用者
    const userRef = platformAdminDb().collection("users").doc(lineUserId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // 第一次登入，建立使用者記錄
      await userRef.set({
        lineUserId,
        email,
        displayName: displayName || "使用者",
        pictureUrl: pictureUrl || null,
        roles: {},
        createdAt: new Date(),
        lastLoginAt: new Date(),
        hasPassword: false
      });
    } else {
      // 更新最後登入時間
      await userRef.update({
        lastLoginAt: new Date(),
        displayName: displayName || userDoc.data()?.displayName,
        pictureUrl: pictureUrl || userDoc.data()?.pictureUrl,
      });
    }

    // 7. 建立 Firebase Custom Token
    const customToken = await platformAdminAuth().createCustomToken(lineUserId, {
      email,
      displayName,
      provider: 'line-oauth'
    });

    // 8. 使用 HTTP-only cookie 傳遞 custom token（安全）
    const redirectUrl = new URL('/admin/login/callback', req.url);
    const response = NextResponse.redirect(redirectUrl);
    
    // 清除 state cookie
    response.cookies.delete('line_oauth_state');
    
    // 設置 custom token cookie（HTTP-only, secure）
    response.cookies.set('firebase_custom_token', customToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 300, // 5 分鐘（短期有效）
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("LINE OAuth callback error:", error);
    return NextResponse.redirect(
      new URL('/admin/login?error=callback_failed', req.url)
    );
  }
}

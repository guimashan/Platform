// src/app/api/auth/line-oauth/callback/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { platformAdminAuth, platformAdminDb } from "@/lib/admin-platform";
import { verifyLineIdToken } from "@/lib/verifyLineIdToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // 強制動態渲染，避免 Next.js 靜態化錯誤

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

    // 安全解析 JSON（處理可能包含控制字符的響應）
    let tokenData: { access_token: string; id_token: string };
    try {
      const responseText = await tokenResponse.text();
      
      // 診斷日誌：顯示原始響應（前 200 字符）
      console.log('🔍 Token response 原始內容（前200字）:', responseText.substring(0, 200));
      console.log('🔍 Position 158 附近的字符:', 
        Array.from(responseText.substring(150, 170))
          .map((c, i) => `[${150+i}]=${c.charCodeAt(0)}(${c})`)
          .join(' ')
      );
      
      // 移除 ALL 控制字符，包括換行符（\n, \r）
      // LINE 的 id_token 可能包含 base64 換行導致 JSON 無效
      const cleanedText = responseText.replace(/[\x00-\x1F\x7F]/g, '');
      console.log('✅ 清理後的內容（前200字）:', cleanedText.substring(0, 200));
      
      tokenData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ Token response JSON 解析失敗:', parseError);
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      return NextResponse.redirect(
        new URL(`/admin/login?error=token_parse_failed&detail=${encodeURIComponent(errorMsg)}`, req.url)
      );
    }
    
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;
    
    console.log('📦 Token Exchange Response:', {
      has_access_token: !!accessToken,
      has_id_token: !!idToken,
      id_token_length: idToken?.length || 0,
      id_token_parts: idToken?.split('.').length || 0,
      id_token_preview: idToken ? `${idToken.substring(0, 30)}...${idToken.substring(idToken.length - 30)}` : 'MISSING'
    });

    if (!accessToken || !idToken) {
      console.error('❌ Missing tokens:', { accessToken: !!accessToken, idToken: !!idToken });
      return NextResponse.redirect(
        new URL('/admin/login?error=no_tokens', req.url)
      );
    }
    
    // 驗證 ID token 格式（應該是 3 部分：header.payload.signature）
    if (!idToken || typeof idToken !== 'string' || idToken.split('.').length !== 3) {
      console.error('❌ Invalid ID token format:', idToken);
      return NextResponse.redirect(
        new URL('/admin/login?error=invalid_id_token_format', req.url)
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

    // 安全解析 Profile JSON（處理可能包含控制字符的響應）
    let profile: { userId: string; displayName: string; pictureUrl?: string };
    try {
      const profileText = await profileResponse.text();
      const cleanedProfileText = profileText.replace(/[\x00-\x1F\x7F]/g, '');
      profile = JSON.parse(cleanedProfileText);
    } catch (parseError) {
      console.error('❌ Profile JSON 解析失敗:', parseError);
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      return NextResponse.redirect(
        new URL(`/admin/login?error=profile_parse_failed&detail=${encodeURIComponent(errorMsg)}`, req.url)
      );
    }
    
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
    console.error("❌ LINE OAuth callback error:", error);
    console.error("   Error name:", error instanceof Error ? error.name : 'Unknown');
    console.error("   Error message:", error instanceof Error ? error.message : String(error));
    console.error("   Error stack:", error instanceof Error ? error.stack : 'No stack');
    
    // 將詳細錯誤訊息傳遞給前端（僅用於診斷）
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetail = encodeURIComponent(errorMessage.substring(0, 200));
    
    return NextResponse.redirect(
      new URL(`/admin/login?error=callback_failed&detail=${errorDetail}`, req.url)
    );
  }
}

// src/app/api/auth/line/route.ts
import { NextResponse } from "next/server";
import { platformAdminAuth, platformAdminDb } from "@/lib/admin-platform";
import { verifyLineIdToken } from "@/lib/verifyLine";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    // 1) 取 body
    let idToken: string | undefined;
    let email: string | undefined;
    let displayName: string | undefined;
    let pictureUrl: string | undefined;
    
    try {
      const body = await req.json();
      idToken = body?.idToken;
      email = body?.email;
      displayName = body?.displayName;
      pictureUrl = body?.pictureUrl;
    } catch {
      return NextResponse.json(
        { ok: false, error: "INVALID_JSON_BODY" },
        { status: 400 }
      );
    }
    
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { ok: false, error: "MISSING_ID_TOKEN" },
        { status: 400 }
      );
    }

    // 2) 驗證 LINE ID Token
    const payload = await verifyLineIdToken(idToken);
    const aud = payload.aud;
    const expected = process.env.LINE_CHANNEL_ID;
    
    if (expected && aud && aud !== expected) {
      return NextResponse.json(
        { ok: false, error: "AUD_MISMATCH" },
        { status: 400 }
      );
    }

    const lineUserId = payload.sub;
    if (!lineUserId) {
      return NextResponse.json(
        { ok: false, error: "MISSING_SUB" },
        { status: 400 }
      );
    }

    // 3) 檢查 email（強制要求）
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "MISSING_EMAIL",
          message: "請先在 LINE 設定您的 Email" 
        },
        { status: 400 }
      );
    }

    // 4) 在 platform-bc783 查找或建立使用者
    const userRef = platformAdminDb().collection("users").doc(lineUserId);
    const userDoc = await userRef.get();
    
    let hasPassword = false;
    
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
      hasPassword = false;
    } else {
      // 更新最後登入時間
      const userData = userDoc.data();
      hasPassword = userData?.hasPassword || false;
      
      await userRef.update({
        lastLoginAt: new Date(),
        email, // 更新 email（可能會變）
        displayName: displayName || userData?.displayName || "使用者",
        pictureUrl: pictureUrl || userData?.pictureUrl || null
      });
    }

    // 5) 產生 Firebase Custom Token
    const customToken = await platformAdminAuth().createCustomToken(lineUserId);

    // 6) 回傳
    return NextResponse.json(
      { 
        ok: true, 
        customToken, 
        userId: lineUserId,
        hasPassword, // 告訴前端是否需要設定密碼
        tookMs: Date.now() - startedAt 
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error("[/api/auth/line] ERROR:", err?.message);
    
    return NextResponse.json(
      { ok: false, error: "AUTHENTICATION_FAILED" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "METHOD_NOT_ALLOWED", hint: "Use POST with JSON { idToken, email }" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

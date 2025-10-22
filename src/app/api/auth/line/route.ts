// src/app/api/auth/line/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/admin";
import { verifyLineIdToken } from "@/lib/verifyLine";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    // 1) 取 body
    let idToken: string | undefined;
    try {
      const body = await req.json();
      idToken = body?.idToken;
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
    
    // 🔐 安全修復：不要返回 Channel ID 給前端
    if (expected && aud && aud !== expected) {
      return NextResponse.json(
        { ok: false, error: "AUD_MISMATCH" },
        { status: 400 }
      );
    }

    const sub = payload.sub;
    if (!sub) {
      return NextResponse.json(
        { ok: false, error: "MISSING_SUB" },
        { status: 400 }
      );
    }

    // 3) 產生 Firebase Custom Token
    const customToken = await adminAuth.createCustomToken(sub);

    // 4) 回傳（不包含機密資訊）
    return NextResponse.json(
      { ok: true, customToken, userId: sub, tookMs: Date.now() - startedAt },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    // 🔐 安全修復：只記錄到伺服器日誌，不洩漏詳細錯誤
    console.error("[/api/auth/line] ERROR:", err?.message);
    
    // 返回通用錯誤訊息，不洩漏內部細節
    return NextResponse.json(
      { ok: false, error: "AUTHENTICATION_FAILED" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// 若有人誤用 GET，明確告知
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "METHOD_NOT_ALLOWED", hint: "Use POST with JSON { idToken }" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

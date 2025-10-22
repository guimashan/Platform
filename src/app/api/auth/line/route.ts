// src/app/api/auth/line/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/admin";
import { verifyLineIdToken } from "@/lib/verifyLine";

export const runtime = "nodejs"; // 確保使用 Node 執行環境

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    // 1) 取 body
    let idToken: string | undefined;
    try {
      const body = await req.json();
      idToken = body?.idToken;
    } catch {
      // 有時候前端送空或 Content-Type 不對
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

    // 2) 驗 LINE ID Token
    const payload = await verifyLineIdToken(idToken);
    const aud = payload.aud;
    const expected = process.env.LINE_CHANNEL_ID;
    if (expected && aud && aud !== expected) {
      return NextResponse.json(
        { ok: false, error: "AUD_MISMATCH", detail: { aud, expected } },
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

    // 4) 回傳
    return NextResponse.json(
      { ok: true, customToken, userId: sub, tookMs: Date.now() - startedAt },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    // 會出現在 Vercel Logs，方便定位
    console.error("[/api/auth/line] ERROR:", {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", detail: err?.message || String(err) },
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

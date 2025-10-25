// src/app/api/auth/token/route.ts
// 這個 API 讓前端可以取得存在 HTTP-only cookie 的 custom token
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const tokenCookie = req.headers.get('cookie')?.split('; ')
      .find(c => c.startsWith('firebase_custom_token='))
      ?.split('=')[1];

    if (!tokenCookie) {
      return NextResponse.json(
        { ok: false, error: "NO_TOKEN" },
        { status: 401 }
      );
    }

    // 返回 token 並清除 cookie
    const response = NextResponse.json({ 
      ok: true, 
      token: tokenCookie 
    });
    
    // 清除 cookie（token 只能使用一次）
    response.cookies.delete('firebase_custom_token');
    
    return response;
  } catch (error) {
    console.error("Token retrieval error:", error);
    return NextResponse.json(
      { ok: false, error: "TOKEN_RETRIEVAL_FAILED" },
      { status: 500 }
    );
  }
}

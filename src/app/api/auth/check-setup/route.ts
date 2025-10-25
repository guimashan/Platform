import { NextResponse } from "next/server";
import { platformAdminAuth, platformAdminDb } from "@/lib/admin-platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "未授權" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await platformAdminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await platformAdminDb().collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "使用者不存在" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    return NextResponse.json({
      hasPassword: userData?.hasPassword || false,
      email: userData?.email || ""
    });
  } catch (err: any) {
    console.error("[/api/auth/check-setup] ERROR:", err);
    return NextResponse.json(
      { error: "檢查失敗" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { platformAdminAuth, platformAdminDb } from "@/lib/admin-platform";

export const runtime = "nodejs";

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
      return NextResponse.json({
        isSuperAdmin: false,
        roles: {}
      });
    }

    const userData = userDoc.data();
    
    return NextResponse.json({
      isSuperAdmin: userData?.isSuperAdmin || false,
      roles: userData?.roles || {}
    });
  } catch (err: any) {
    console.error("[/api/auth/permissions] ERROR:", err);
    return NextResponse.json(
      { error: "取得權限失敗" },
      { status: 500 }
    );
  }
}

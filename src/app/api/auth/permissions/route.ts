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
      return NextResponse.json({
        isSuperAdmin: false,
        roles: {}
      });
    }

    const userData = userDoc.data();
    
    return NextResponse.json({
      isSuperAdmin: userData?.isSuperAdmin || false,
      roles: userData?.roles || {},
      // 新架構：業務層角色
      checkin_role: userData?.checkin_role || "user",
      schedule_role: userData?.schedule_role || "user",
      service_role: userData?.service_role || "user",
    });
  } catch (err: any) {
    console.error("[/api/auth/permissions] ERROR:", err);
    return NextResponse.json(
      { error: "取得權限失敗" },
      { status: 500 }
    );
  }
}

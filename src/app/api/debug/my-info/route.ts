// 臨時 API - 查看當前用戶資訊（測試用）
import { NextResponse } from "next/server";
import { platformAdminAuth, platformAdminDb } from "@/lib/admin-platform";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未授權 - 請先登入" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await platformAdminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await platformAdminDb().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({
        uid,
        error: "使用者不存在於資料庫",
        decodedToken,
      });
    }

    const userData = userDoc.data();

    return NextResponse.json({
      uid,
      email: userData?.email,
      displayName: userData?.displayName,
      isSuperAdmin: userData?.isSuperAdmin,
      checkin_role: userData?.checkin_role,
      schedule_role: userData?.schedule_role,
      service_role: userData?.service_role,
      roles: userData?.roles,
      createdAt: userData?.createdAt,
      lastLoginAt: userData?.lastLoginAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

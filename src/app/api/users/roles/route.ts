import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未授權：缺少 Token" }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: "未授權：無效的 Token" }, { status: 401 });
    }

    const adminDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const adminData = adminDoc.data();
    if (!adminData?.isSuperAdmin) {
      return NextResponse.json({ error: "只有 SuperAdmin 可以修改權限" }, { status: 403 });
    }

    const { userId, roles } = await req.json();

    if (!userId || !roles) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    await adminDb.collection("users").doc(userId).update({ roles });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("修改權限 API 錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤", details: error.message },
      { status: 500 }
    );
  }
}

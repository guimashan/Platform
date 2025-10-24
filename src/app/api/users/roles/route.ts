import { NextRequest, NextResponse } from "next/server";
import { platformAdminDb } from "@/lib/admin-platform";
import { verifyAuth } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const auth = await verifyAuth(authHeader);
    
    if (!auth) {
      return NextResponse.json({ error: "未授權：無效的 Token" }, { status: 401 });
    }

    if (!auth.userData?.isSuperAdmin) {
      return NextResponse.json({ error: "只有 SuperAdmin 可以修改權限" }, { status: 403 });
    }

    const { userId, roles } = await req.json();

    if (!userId || !roles) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    await platformAdminDb().collection("users").doc(userId).update({ roles });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("修改權限 API 錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤", details: error.message },
      { status: 500 }
    );
  }
}

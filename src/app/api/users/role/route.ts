import { NextRequest, NextResponse } from "next/server";
import { platformAdminDb } from "@/lib/admin-platform";
import { verifyAuth, checkSetRolePermission } from "@/lib/auth-helpers";
import { UserRole } from "@/types";

/**
 * 設定使用者角色
 * POST /api/users/role
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "未提供認證" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { uid: adminUid, userData: adminData } = await verifyAuth(token);

    const { targetUid, role } = await req.json();

    if (!targetUid || !role) {
      return NextResponse.json(
        { error: "缺少 targetUid 或 role" },
        { status: 400 }
      );
    }

    // 驗證角色值
    const validRoles: UserRole[] = ["user", "poweruser", "admin", "superadmin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "無效的角色" },
        { status: 400 }
      );
    }

    // 檢查權限
    const permission = checkSetRolePermission(adminData, role);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 403 }
      );
    }

    // 更新使用者角色
    const db = platformAdminDb();
    await db.collection("users").doc(targetUid).update({
      role,
      updatedAt: new Date(),
    });

    // 如果設定為 superadmin，同時設定 isSuperAdmin
    if (role === "superadmin") {
      await db.collection("users").doc(targetUid).update({
        isSuperAdmin: true,
      });
    } else {
      // 移除 isSuperAdmin 標記
      await db.collection("users").doc(targetUid).update({
        isSuperAdmin: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: `已將使用者設定為 ${role}`,
    });
  } catch (error: any) {
    console.error("[users/role] ERROR:", error);
    return NextResponse.json(
      { error: error.message || "設定角色失敗" },
      { status: 500 }
    );
  }
}

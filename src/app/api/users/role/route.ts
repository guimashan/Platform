import { NextRequest, NextResponse } from "next/server";
import { platformAdminDb } from "@/lib/admin-platform";
import { verifyAuth } from "@/lib/auth-helpers";
import { UserRole } from "@/types";

/**
 * 設定使用者角色
 * POST /api/users/role
 * 
 * 權限規則：
 * - SuperAdmin：可以設定任何系統的任何角色（checkin_role, schedule_role, service_role）
 * - checkin admin：只能設定 checkin_role（user, poweruser, admin）
 * - schedule admin：只能設定 schedule_role（user, poweruser, admin）
 * - service admin：只能設定 service_role（user, poweruser, admin）
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "未提供認證" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const auth = await verifyAuth(token);
    
    if (!auth) {
      return NextResponse.json({ error: "認證失敗" }, { status: 401 });
    }

    const { userData: adminData } = auth;
    const { targetUid, system, role } = await req.json();

    if (!targetUid || !system || !role) {
      return NextResponse.json(
        { error: "缺少 targetUid、system 或 role" },
        { status: 400 }
      );
    }

    const validSystems = ["checkin", "schedule", "service"];
    if (!validSystems.includes(system)) {
      return NextResponse.json(
        { error: "無效的系統名稱" },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ["user", "poweruser", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "無效的角色" },
        { status: 400 }
      );
    }

    const isSuperAdmin = adminData.isSuperAdmin === true;

    if (!isSuperAdmin) {
      const roleField = `${system}_role` as "checkin_role" | "schedule_role" | "service_role";
      const isSystemAdmin = adminData[roleField] === "admin";
      
      if (!isSystemAdmin) {
        return NextResponse.json(
          { error: `需要 ${system} admin 或 SuperAdmin 權限` },
          { status: 403 }
        );
      }
    }

    const db = platformAdminDb();
    const roleField = `${system}_role`;
    
    await db.collection("users").doc(targetUid).update({
      [roleField]: role,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `已將使用者的 ${system} 角色設定為 ${role}`,
    });
  } catch (error: any) {
    console.error("[users/role] ERROR:", error);
    return NextResponse.json(
      { error: error.message || "設定角色失敗" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { platformAdminDb } from "@/lib/admin-platform";
import { checkinAdminDb } from "@/lib/admin-checkin";
import { verifyAuth } from "@/lib/auth-helpers";
import type { UserDoc } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const auth = await verifyAuth(authHeader);
    
    if (!auth) {
      return NextResponse.json({ error: "未授權：無效的 Token" }, { status: 401 });
    }

    const { userData } = auth;
    const isSuperAdmin = userData.isSuperAdmin === true;

    const searchParams = req.nextUrl.searchParams;
    const system = searchParams.get("system");

    if (!isSuperAdmin) {
      if (system) {
        const roleField = `${system}_role` as "checkin_role" | "schedule_role" | "service_role";
        const isSystemAdmin = userData[roleField] === "admin";
        
        if (!isSystemAdmin) {
          return NextResponse.json(
            { error: `需要 ${system} admin 或 SuperAdmin 權限` },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "需要指定 system 參數" },
          { status: 400 }
        );
      }
    }

    const usersSnapshot = await platformAdminDb().collection("users").get();
    const users: (UserDoc & { id: string })[] = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as UserDoc),
    }));

    const checkinsSnapshot = await checkinAdminDb().collection("checkins").get();
    const checkinCounts = new Map<string, number>();
    checkinsSnapshot.docs.forEach((doc) => {
      const uid = doc.data().uid;
      checkinCounts.set(uid, (checkinCounts.get(uid) || 0) + 1);
    });

    const usersWithStats = users.map((user) => ({
      ...user,
      checkinCount: checkinCounts.get(user.id) || 0,
    }));

    if (system) {
      usersWithStats.sort((a, b) => b.checkinCount - a.checkinCount);
      return NextResponse.json({ users: usersWithStats });
    }

    usersWithStats.sort((a, b) => b.checkinCount - a.checkinCount);

    return NextResponse.json({ users: usersWithStats });
  } catch (error: any) {
    console.error("查詢使用者 API 錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤", details: error.message },
      { status: 500 }
    );
  }
}

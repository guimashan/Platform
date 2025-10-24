import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/admin";
import type { UserDoc } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (!userData?.isSuperAdmin && !userData?.roles?.checkin_admin) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const usersSnapshot = await adminDb.collection("users").get();
    const users: (UserDoc & { id: string })[] = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as UserDoc),
    }));

    const checkinsSnapshot = await adminDb.collection("checkins").get();
    const checkinCounts = new Map<string, number>();
    checkinsSnapshot.docs.forEach((doc) => {
      const uid = doc.data().uid;
      checkinCounts.set(uid, (checkinCounts.get(uid) || 0) + 1);
    });

    const usersWithStats = users.map((user) => ({
      ...user,
      checkinCount: checkinCounts.get(user.id) || 0,
    }));

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

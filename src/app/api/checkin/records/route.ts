import { NextRequest, NextResponse } from "next/server";
import { checkinAdminDb } from "@/lib/admin-checkin";
import { platformAdminDb } from "@/lib/admin-platform";
import { verifyAuth, hasCheckinAdmin } from "@/lib/auth-helpers";
import type { Checkin } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const auth = await verifyAuth(authHeader);
    
    if (!auth) {
      return NextResponse.json({ error: "未授權：無效的 Token" }, { status: 401 });
    }

    if (!hasCheckinAdmin(auth)) {
      return NextResponse.json(
        { error: "權限不足：需要管理員權限" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const patrolId = searchParams.get("patrolId") || "";
    const uid = searchParams.get("uid") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const cursor = searchParams.get("cursor") || "";

    let query: any = checkinAdminDb().collection("checkins");

    if (patrolId) {
      query = query.where("patrolId", "==", patrolId);
    }
    if (uid) {
      query = query.where("uid", "==", uid);
    }
    if (startDate) {
      const start = new Date(startDate).getTime();
      query = query.where("ts", ">=", start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000;
      query = query.where("ts", "<", end);
    }

    query = query.orderBy("ts", sortOrder === "asc" ? "asc" : "desc");

    if (cursor) {
      try {
        const cursorDoc = await checkinAdminDb().collection("checkins").doc(cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      } catch (e) {
        console.error("Invalid cursor:", e);
      }
    }

    const snapshot = await query.limit(limit + 1).get();
    
    const hasMore = snapshot.size > limit;
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

    const records: (Checkin & { id: string; timestamp: string; patrolName?: string; userName?: string })[] = docs.map((doc) => {
      const data = doc.data() as Checkin;
      return {
        id: doc.id,
        uid: data.uid,
        patrolId: data.patrolId,
        ts: data.ts,
        meta: data.meta,
        timestamp: new Date(data.ts).toISOString(),
      };
    });

    const pointsSnapshot = await checkinAdminDb().collection("points").get();
    const pointsMap = new Map<string, string>();
    pointsSnapshot.docs.forEach((doc) => {
      pointsMap.set(doc.id, doc.data().name);
    });

    const usersSnapshot = await platformAdminDb().collection("users").get();
    const usersMap = new Map<string, string>();
    usersSnapshot.docs.forEach((doc) => {
      usersMap.set(doc.id, doc.data().displayName || "未知");
    });

    records.forEach((record) => {
      record.patrolName = pointsMap.get(record.patrolId) || "未知";
      record.userName = usersMap.get(record.uid) || "未知";
    });

    const nextCursor = hasMore && docs.length > 0 ? docs[docs.length - 1].id : null;

    return NextResponse.json({
      records,
      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
    });
  } catch (error: any) {
    console.error("查詢記錄 API 錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤", details: error.message },
      { status: 500 }
    );
  }
}

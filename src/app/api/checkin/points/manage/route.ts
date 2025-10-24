import { NextRequest, NextResponse } from "next/server";
import { checkinAdminDb } from "@/lib/admin-checkin";
import { verifyAuth, checkManagePatrolsPermission } from "@/lib/auth-helpers";

/**
 * 取得所有巡邏點
 * GET /api/checkin/points/manage
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "未提供認證" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { uid, userData } = await verifyAuth(token);

    // 檢查權限
    const permission = checkManagePatrolsPermission(userData);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 403 }
      );
    }

    const db = checkinAdminDb();
    const snapshot = await db.collection("points").orderBy("createdAt", "desc").get();

    const patrols = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ patrols });
  } catch (error: any) {
    console.error("[checkin/points/manage GET] ERROR:", error);
    return NextResponse.json(
      { error: error.message || "取得巡邏點失敗" },
      { status: 500 }
    );
  }
}

/**
 * 新增巡邏點
 * POST /api/checkin/points/manage
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "未提供認證" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { uid, userData } = await verifyAuth(token);

    // 檢查權限
    const permission = checkManagePatrolsPermission(userData);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 403 }
      );
    }

    const { name, qr, lat, lng, tolerance, active } = await req.json();

    if (!name || !qr || lat === undefined || lng === undefined || tolerance === undefined) {
      return NextResponse.json(
        { error: "缺少必要欄位（name, qr, lat, lng, tolerance）" },
        { status: 400 }
      );
    }

    const db = checkinAdminDb();
    const patrolRef = db.collection("points").doc();

    await patrolRef.set({
      id: patrolRef.id,
      name,
      qr,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      tolerance: parseFloat(tolerance),
      active: active !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      patrolId: patrolRef.id,
    });
  } catch (error: any) {
    console.error("[checkin/points/manage POST] ERROR:", error);
    return NextResponse.json(
      { error: error.message || "新增巡邏點失敗" },
      { status: 500 }
    );
  }
}

/**
 * 更新巡邏點
 * PATCH /api/checkin/points/manage
 */
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "未提供認證" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { uid, userData } = await verifyAuth(token);

    // 檢查權限
    const permission = checkManagePatrolsPermission(userData);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 403 }
      );
    }

    const { patrolId, name, qr, lat, lng, tolerance, active } = await req.json();

    if (!patrolId) {
      return NextResponse.json(
        { error: "缺少 patrolId" },
        { status: 400 }
      );
    }

    const db = checkinAdminDb();
    const updateData: any = { updatedAt: new Date() };

    if (name !== undefined) updateData.name = name;
    if (qr !== undefined) updateData.qr = qr;
    if (lat !== undefined) updateData.lat = parseFloat(lat);
    if (lng !== undefined) updateData.lng = parseFloat(lng);
    if (tolerance !== undefined) updateData.tolerance = parseFloat(tolerance);
    if (active !== undefined) updateData.active = active;

    await db.collection("points").doc(patrolId).update(updateData);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("[checkin/points/manage PATCH] ERROR:", error);
    return NextResponse.json(
      { error: error.message || "更新巡邏點失敗" },
      { status: 500 }
    );
  }
}

/**
 * 刪除巡邏點
 * DELETE /api/checkin/points/manage
 */
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "未提供認證" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { uid, userData } = await verifyAuth(token);

    // 檢查權限
    const permission = checkManagePatrolsPermission(userData);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const patrolId = searchParams.get("patrolId");

    if (!patrolId) {
      return NextResponse.json(
        { error: "缺少 patrolId" },
        { status: 400 }
      );
    }

    const db = checkinAdminDb();
    await db.collection("points").doc(patrolId).delete();

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("[checkin/points/manage DELETE] ERROR:", error);
    return NextResponse.json(
      { error: error.message || "刪除巡邏點失敗" },
      { status: 500 }
    );
  }
}

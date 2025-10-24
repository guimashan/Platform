import { NextRequest, NextResponse } from "next/server";
import { checkinAdminDb } from "@/lib/admin-checkin";
import { verifyAuth, checkCheckinPermission, verifyGpsLocation } from "@/lib/auth-helpers";
import { CheckinRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: CheckinRequest = await req.json();
    const { idToken, qrCode, userLat, userLng } = body;

    // 1. 驗證使用者身份
    const { uid, userData } = await verifyAuth(idToken);

    // 2. 檢查簽到權限
    const hasGps = userLat !== undefined && userLng !== undefined;
    const permission = checkCheckinPermission(userData, hasGps);

    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason },
        { status: 403 }
      );
    }

    // 3. 查詢巡邏點
    const db = checkinAdminDb();
    const pointsSnapshot = await db
      .collection("points")
      .where("qr", "==", qrCode)
      .where("active", "==", true)
      .get();

    if (pointsSnapshot.empty) {
      return NextResponse.json(
        { error: "無效的 QR Code 或巡邏點未啟用" },
        { status: 400 }
      );
    }

    const patrolDoc = pointsSnapshot.docs[0];
    const patrolData = patrolDoc.data();
    const patrolId = patrolDoc.id;

    // 4. GPS 驗證（user 角色必須驗證）
    let gpsVerified = false;
    let distance: number | undefined;

    if (permission.role === "user") {
      // user 必須提供 GPS 並驗證
      if (!userLat || !userLng) {
        return NextResponse.json(
          { error: "user 角色必須提供 GPS 位置" },
          { status: 400 }
        );
      }

      const gpsCheck = verifyGpsLocation(
        { lat: userLat, lng: userLng },
        { lat: patrolData.lat, lng: patrolData.lng },
        patrolData.tolerance
      );

      if (!gpsCheck.valid) {
        return NextResponse.json(
          { 
            error: `GPS 位置不在範圍內（距離 ${gpsCheck.distance} 公尺，需在 ${patrolData.tolerance} 公尺內）`,
            distance: gpsCheck.distance,
            tolerance: patrolData.tolerance
          },
          { status: 400 }
        );
      }

      gpsVerified = true;
      distance = gpsCheck.distance;
    } else {
      // poweruser/admin/superadmin 免 GPS 驗證
      gpsVerified = false;
      if (userLat && userLng) {
        // 如果有提供 GPS，仍然記錄距離（但不驗證）
        const gpsCheck = verifyGpsLocation(
          { lat: userLat, lng: userLng },
          { lat: patrolData.lat, lng: patrolData.lng },
          patrolData.tolerance
        );
        distance = gpsCheck.distance;
      }
    }

    // 5. 檢查重複簽到（5 分鐘內）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCheckinsSnapshot = await db
      .collection("checkins")
      .where("uid", "==", uid)
      .where("patrolId", "==", patrolId)
      .where("ts", ">=", fiveMinutesAgo)
      .get();

    if (!recentCheckinsSnapshot.empty) {
      return NextResponse.json(
        { error: "5 分鐘內已經在此巡邏點簽到過" },
        { status: 400 }
      );
    }

    // 6. 建立簽到記錄
    const checkinRef = db.collection("checkins").doc();
    const checkinData = {
      id: checkinRef.id,
      uid,
      patrolId,
      patrolName: patrolData.name,
      userLat: userLat || null,
      userLng: userLng || null,
      distance: distance || null,
      gpsVerified,
      ts: new Date(),
      meta: {
        ua: req.headers.get("user-agent") || undefined,
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        role: permission.role,
      },
    };

    await checkinRef.set(checkinData);

    return NextResponse.json({
      success: true,
      checkin: {
        id: checkinRef.id,
        patrolName: patrolData.name,
        timestamp: checkinData.ts.toISOString(),
        gpsVerified,
        distance,
        role: permission.role,
      },
    });
  } catch (error: any) {
    console.error("[checkin/create] ERROR:", error);
    return NextResponse.json(
      { error: error.message || "簽到失敗" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/admin";
import type { Patrol } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    const { name, qr } = await req.json();

    if (!name || !qr) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    const existingPoint = await adminDb
      .collection("points")
      .where("qr", "==", qr)
      .limit(1)
      .get();

    if (!existingPoint.empty) {
      return NextResponse.json({ error: "QR Code 已存在" }, { status: 400 });
    }

    const patrolData: Omit<Patrol, "id"> = {
      name,
      qr,
      active: true,
      createdAt: Date.now(),
    };

    const docRef = await adminDb.collection("points").add(patrolData);

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      patrol: { id: docRef.id, ...patrolData },
    });
  } catch (error: any) {
    console.error("新增巡邏點錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤", details: error.message },
      { status: 500 }
    );
  }
}

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

    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (!userData?.isSuperAdmin && !userData?.roles?.checkin_admin) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const { id, name, qr, active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "缺少巡邏點 ID" }, { status: 400 });
    }

    const updateData: Partial<Patrol> = {};
    if (name !== undefined) updateData.name = name;
    if (qr !== undefined) updateData.qr = qr;
    if (active !== undefined) updateData.active = active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "沒有需要更新的欄位" }, { status: 400 });
    }

    await adminDb.collection("points").doc(id).update(updateData);

    return NextResponse.json({ ok: true, updated: updateData });
  } catch (error: any) {
    console.error("更新巡邏點錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少巡邏點 ID" }, { status: 400 });
    }

    await adminDb.collection("points").doc(id).delete();

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("刪除巡邏點錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤", details: error.message },
      { status: 500 }
    );
  }
}

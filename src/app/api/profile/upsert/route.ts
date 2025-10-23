// src/app/api/profile/upsert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/admin";
import type { UserDoc } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. 驗證 Firebase ID Token
    const auth = req.headers.get("authorization") || "";
    const match = auth.match(/^Bearer\s+(.+)$/);
    
    if (!match) {
      return NextResponse.json(
        { ok: false, error: "MISSING_ID_TOKEN" },
        { status: 401 }
      );
    }

    const idToken = match[1];
    let decoded;
    
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch (err) {
      console.error("[/api/profile/upsert] Token verification failed:", err);
      return NextResponse.json(
        { ok: false, error: "INVALID_ID_TOKEN" },
        { status: 401 }
      );
    }

    const uid = decoded.uid;

    // 2. 取得請求資料
    const body = await req.json();
    const { displayName, pictureUrl, lineUserId } = body;

    const now = Date.now();
    const usersRef = adminDb.collection("users");
    const userRef = usersRef.doc(uid);
    const userSnap = await userRef.get();

    // 3. 檢查是否為第一個用戶（SuperAdmin）
    const isFirstUser = !userSnap.exists && (await usersRef.limit(1).get()).empty;

    if (!userSnap.exists) {
      // 新用戶
      const newUser: UserDoc = {
        displayName: displayName || decoded.name || "未命名",
        pictureUrl: pictureUrl || decoded.picture || "",
        lineUserId: lineUserId || decoded.sub || "",
        roles: {
          user: true,
          poweruser: false,
          admin: false,
          superadmin: isFirstUser,
        },
        isSuperAdmin: isFirstUser,
        createdAt: now,
        lastLoginAt: now,
      };

      await userRef.set(newUser);

      return NextResponse.json({
        ok: true,
        user: { uid, ...newUser },
        isFirstUser,
      });
    } else {
      // 既有用戶，更新登入時間和資料
      const updates: Partial<UserDoc> = {
        lastLoginAt: now,
      };

      if (displayName) updates.displayName = displayName;
      if (pictureUrl) updates.pictureUrl = pictureUrl;
      if (lineUserId) updates.lineUserId = lineUserId;

      await userRef.update(updates);

      const updatedSnap = await userRef.get();
      const userData = updatedSnap.data();

      return NextResponse.json({
        ok: true,
        user: { uid, ...userData },
        isFirstUser: false,
      });
    }
  } catch (err: any) {
    console.error("[/api/profile/upsert] ERROR:", err?.message);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "METHOD_NOT_ALLOWED", hint: "Use POST with Bearer token" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

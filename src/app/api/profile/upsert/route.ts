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
    const userRef = adminDb.collection("users").doc(uid);
    
    // 檢查用戶是否已存在
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // 3. 新用戶 - 使用 Transaction 確保 SuperAdmin 唯一性
      const result = await adminDb.runTransaction(async (transaction) => {
        // 使用 sentinel document 標記 SuperAdmin
        const superadminMetaRef = adminDb.collection("_meta").doc("superadmin");
        const metaSnap = await transaction.get(superadminMetaRef);
        
        // 檢查是否已有 SuperAdmin
        const isFirstUser = !metaSnap.exists;
        
        const newUser: UserDoc = {
          displayName: displayName || decoded.name || "未命名",
          pictureUrl: pictureUrl || decoded.picture || "",
          lineUserId: lineUserId || decoded.sub || "",
          role: isFirstUser ? "superadmin" : "user",
          isSuperAdmin: isFirstUser,
          createdAt: now as any,
          lastLoginAt: now as any,
        };

        // 原子性操作：同時設置用戶和 SuperAdmin 標記
        transaction.set(userRef, newUser);
        
        if (isFirstUser) {
          // 標記已有 SuperAdmin，防止其他用戶成為 SuperAdmin
          transaction.set(superadminMetaRef, {
            uid,
            assignedAt: now,
            displayName: newUser.displayName,
          });
          console.log(`[/api/profile/upsert] First user registered as SuperAdmin: ${uid}`);
        }

        return { newUser, isFirstUser };
      });

      return NextResponse.json({
        ok: true,
        user: { uid, ...result.newUser },
        isFirstUser: result.isFirstUser,
      });
    } else {
      // 既有用戶，更新登入時間和資料
      const updates: Partial<UserDoc> = {
        lastLoginAt: now as any,
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

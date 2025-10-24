import { NextResponse } from "next/server";
import { platformAdminAuth, platformAdminDb } from "@/lib/admin-platform";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "未授權" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await platformAdminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "密碼至少需要 6 個字元" },
        { status: 400 }
      );
    }

    // 取得使用者資料
    const userDoc = await platformAdminDb().collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "使用者不存在" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const email = userData?.email;

    if (!email) {
      return NextResponse.json(
        { error: "Email 不存在" },
        { status: 400 }
      );
    }

    // 在 Firebase Auth 建立 Email/Password 帳號
    try {
      await platformAdminAuth().createUser({
        uid,
        email,
        password,
        displayName: userData?.displayName || "使用者"
      });
    } catch (err: any) {
      // 如果帳號已存在，更新密碼
      if (err.code === "auth/uid-already-exists") {
        await platformAdminAuth().updateUser(uid, {
          password
        });
      } else {
        throw err;
      }
    }

    // 更新 Firestore 標記
    await platformAdminDb().collection("users").doc(uid).update({
      hasPassword: true,
      passwordSetAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[/api/auth/setup-password] ERROR:", err);
    return NextResponse.json(
      { error: "設定失敗", message: err.message },
      { status: 500 }
    );
  }
}

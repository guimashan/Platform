import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/admin'; // ← 這行要用命名匯出

export async function POST(req: Request) {
  try {
    const { idToken, pid, lat, lng } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    // 這裡 decoded 的型別就會正確（含 uid / aud / sub 等）
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // ... 後面你的商業邏輯（寫入 Firestore 等）
    return NextResponse.json({ ok: true, uid });
  } catch (err: any) {
    return NextResponse.json(
      { error: '伺服器錯誤', detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

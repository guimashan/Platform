import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/admin';

export async function POST(req: Request) {
  try {
    const { idToken, pid, lat, lng } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    // 驗證 Firebase ID Token
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // TODO: 實作簽到邏輯（寫入 Firestore 等）
    // const checkinData = { uid, pid, lat, lng, timestamp: new Date().toISOString() };
    
    // 🔐 安全改進：不返回 uid（前端已知道自己的身份）
    return NextResponse.json({ 
      ok: true,
      message: '簽到成功'
    });
  } catch (err: any) {
    // 🔐 不返回詳細錯誤訊息
    console.error('[checkin/create] Error:', err?.message);
    
    return NextResponse.json(
      { error: '簽到失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

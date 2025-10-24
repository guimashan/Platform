import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/admin';
import type { Checkin, Patrol } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/checkin/history?idToken=xxx&limit=20
 * 取得使用者的簽到歷史記錄
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idToken = searchParams.get('idToken');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!idToken) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    // 驗證 Firebase ID Token
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // 取得使用者簽到記錄（按時間倒序）
    const checkinsSnapshot = await adminDb
      .collection('checkins')
      .where('uid', '==', uid)
      .orderBy('ts', 'desc')
      .limit(limit)
      .get();

    // 取得所有巡邏點資料（用於對應名稱）
    const pointsSnapshot = await adminDb.collection('points').get();
    const pointsMap = new Map<string, Patrol>();
    
    pointsSnapshot.forEach((doc) => {
      const data = doc.data();
      pointsMap.set(doc.id, {
        id: doc.id,
        name: data.name,
        qr: data.qr,
        active: data.active,
        createdAt: data.createdAt,
      });
    });

    // 組合簽到記錄與巡邏點資訊
    const history = checkinsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const patrol = pointsMap.get(data.patrolId);

      return {
        id: doc.id,
        uid: data.uid,
        patrolId: data.patrolId,
        patrolName: patrol?.name || '未知地點',
        ts: data.ts,
        meta: data.meta,
      };
    });

    return NextResponse.json({
      ok: true,
      history,
      total: history.length,
    });

  } catch (err: any) {
    console.error('[checkin/history] Error:', err?.message);
    
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: '登入已過期，請重新登入' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '取得簽到歷史失敗' },
      { status: 500 }
    );
  }
}

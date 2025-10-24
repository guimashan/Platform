import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/admin';
import type { Checkin } from '@/types';

export async function POST(req: Request) {
  try {
    const { idToken, qrCode } = await req.json();

    // 驗證必要參數
    if (!idToken) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    if (!qrCode) {
      return NextResponse.json({ error: '缺少 QR Code' }, { status: 400 });
    }

    // 驗證 Firebase ID Token
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // 驗證 QR Code 是否對應有效的巡邏點
    const pointsSnapshot = await adminDb
      .collection('points')
      .where('qr', '==', qrCode)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (pointsSnapshot.empty) {
      return NextResponse.json({ 
        error: '無效的 QR Code' 
      }, { status: 400 });
    }

    const patrolDoc = pointsSnapshot.docs[0];
    const patrolId = patrolDoc.id;
    const patrolName = patrolDoc.data().name;

    // 檢查是否重複簽到（5分鐘內同一個巡邏點）
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentCheckinSnapshot = await adminDb
      .collection('checkins')
      .where('uid', '==', uid)
      .where('patrolId', '==', patrolId)
      .where('ts', '>', fiveMinutesAgo)
      .limit(1)
      .get();

    if (!recentCheckinSnapshot.empty) {
      return NextResponse.json({
        error: '您剛才已經在此巡邏點簽到過了',
        duplicateCheckin: true,
      }, { status: 400 });
    }

    // 取得用戶資訊和 metadata
    const userAgent = req.headers.get('user-agent') || undefined;
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || undefined;

    // 建立簽到記錄
    const checkinData: Omit<Checkin, 'id'> = {
      uid,
      patrolId,
      ts: Date.now(),
      meta: {
        ua: userAgent,
        ip,
      },
    };

    const checkinRef = await adminDb.collection('checkins').add(checkinData);

    // 返回成功訊息
    return NextResponse.json({
      ok: true,
      message: '簽到成功',
      checkin: {
        id: checkinRef.id,
        patrolName,
        timestamp: checkinData.ts,
      },
    });

  } catch (err: any) {
    console.error('[checkin/create] Error:', err?.message);
    
    // 處理特定錯誤
    if (err?.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: '登入已過期，請重新登入' },
        { status: 401 }
      );
    }

    if (err?.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: '登入資訊無效' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '簽到失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

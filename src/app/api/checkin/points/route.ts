import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';
import type { Patrol } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/checkin/points
 * 取得所有啟用的巡邏點
 */
export async function GET() {
  try {
    const pointsSnapshot = await adminDb
      .collection('points')
      .where('active', '==', true)
      .get();

    const points: Patrol[] = [];
    pointsSnapshot.forEach((doc) => {
      const data = doc.data();
      points.push({
        id: doc.id,
        name: data.name,
        qr: data.qr,
        active: data.active,
        createdAt: data.createdAt,
      });
    });

    // 在記憶體中排序（避免需要 Firestore 索引）
    points.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return NextResponse.json({
      ok: true,
      points,
    });
  } catch (error) {
    console.error('[checkin/points] Error:', error);
    return NextResponse.json(
      { error: '取得巡邏點失敗' },
      { status: 500 }
    );
  }
}

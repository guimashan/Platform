import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';
import type { Patrol } from '@/types';

/**
 * GET /api/checkin/points
 * 取得所有啟用的巡邏點
 */
export async function GET() {
  try {
    const pointsSnapshot = await adminDb
      .collection('points')
      .where('active', '==', true)
      .orderBy('createdAt', 'asc')
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

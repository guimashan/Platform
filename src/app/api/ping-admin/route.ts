import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/admin';

export async function GET() {
  try {
    // 檢查 Firebase Admin SDK 是否正常運作
    const healthChecks = {
      timestamp: new Date().toISOString(),
      services: {} as Record<string, boolean>
    };

    // 1. 檢查 Firebase Admin Auth
    try {
      await adminAuth.listUsers(1); // 只取 1 個用戶測試連線
      healthChecks.services.auth = true;
    } catch (err) {
      console.error('[ping-admin] Auth check failed:', err);
      healthChecks.services.auth = false;
    }

    // 2. 檢查 Firebase Admin Firestore
    try {
      await adminDb.collection('_health_check').limit(1).get();
      healthChecks.services.firestore = true;
    } catch (err) {
      console.error('[ping-admin] Firestore check failed:', err);
      healthChecks.services.firestore = false;
    }

    // 3. 檢查環境變數
    const envChecks = {
      serviceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    };

    const allHealthy = Object.values(healthChecks.services).every(v => v === true);

    return NextResponse.json({
      ok: allHealthy,
      ...healthChecks,
      env: envChecks
    }, {
      status: allHealthy ? 200 : 503
    });
  } catch (err: any) {
    console.error('[ping-admin] Unexpected error:', err?.message);
    
    return NextResponse.json({
      ok: false,
      error: 'Admin SDK health check failed',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}

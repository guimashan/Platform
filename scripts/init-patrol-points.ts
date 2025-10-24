#!/usr/bin/env tsx
/**
 * 初始化巡邏點資料到 Firestore
 * 執行：npx tsx scripts/init-patrol-points.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 載入環境變數
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON 環境變數未設置');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);

// 初始化 Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// 三個巡邏點定義
const patrolPoints = [
  {
    id: 'point-yuji',
    name: '玉旨牌',
    qr: 'PATROL_YUJI',
    active: true,
    createdAt: Date.now(),
  },
  {
    id: 'point-wanying',
    name: '萬應公',
    qr: 'PATROL_WANYING',
    active: true,
    createdAt: Date.now(),
  },
  {
    id: 'point-office',
    name: '辦公室',
    qr: 'PATROL_OFFICE',
    active: true,
    createdAt: Date.now(),
  },
];

async function initPatrolPoints() {
  console.log('🚀 開始初始化巡邏點...');
  console.log(`📊 Firestore 專案：${serviceAccount.project_id}`);
  console.log('');

  for (const point of patrolPoints) {
    try {
      const docRef = db.collection('points').doc(point.id);
      const doc = await docRef.get();

      if (doc.exists) {
        // 更新現有巡邏點（保留原始 createdAt）
        const existingData = doc.data();
        await docRef.update({
          name: point.name,
          qr: point.qr,
          active: point.active,
        });
        console.log(`🔄 ${point.name} (${point.id}) 更新成功`);
        console.log(`   QR Code: ${point.qr}`);
      } else {
        await docRef.set(point);
        console.log(`✅ ${point.name} (${point.id}) 建立成功`);
        console.log(`   QR Code: ${point.qr}`);
      }
    } catch (error) {
      console.error(`❌ ${point.name} 處理失敗:`, error);
    }
  }

  console.log('');
  console.log('🎉 巡邏點初始化完成！');
  console.log('');
  console.log('📋 巡邏點列表：');
  patrolPoints.forEach((point) => {
    console.log(`   • ${point.name}: ${point.qr}`);
  });
}

initPatrolPoints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 初始化失敗:', error);
    process.exit(1);
  });

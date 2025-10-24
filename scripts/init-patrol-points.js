/**
 * 初始化巡邏點資料到 Firebase
 */

const admin = require('firebase-admin');

// 初始化 Firebase Admin
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error('❌ 錯誤：未找到 FIREBASE_SERVICE_ACCOUNT_JSON 環境變數');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// 巡邏點資料
const patrolPoints = [
  {
    id: 'point-yuji',
    name: '玉旨牌',
    qr: 'PATROL_YUJI',
    lat: 25.147924,
    lng: 121.410296,
    tolerance: 50, // 50 公尺容許誤差
    active: true,
  },
  {
    id: 'point-wanying',
    name: '萬應公',
    qr: 'PATROL_WANYING',
    lat: 25.148123,
    lng: 121.410567,
    tolerance: 50,
    active: true,
  },
  {
    id: 'point-office',
    name: '辦公室',
    qr: 'PATROL_OFFICE',
    lat: 25.147756,
    lng: 121.410134,
    tolerance: 30,
    active: true,
  },
];

async function initializePatrolPoints() {
  console.log('🚀 開始初始化巡邏點資料...\n');

  try {
    for (const point of patrolPoints) {
      const docRef = db.collection('points').doc(point.id);
      const doc = await docRef.get();

      if (doc.exists) {
        // 更新現有巡邏點
        await docRef.update({
          ...point,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ 更新巡邏點: ${point.name} (${point.id})`);
      } else {
        // 建立新巡邏點
        await docRef.set({
          ...point,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✨ 新增巡邏點: ${point.name} (${point.id})`);
      }

      console.log(`   📍 座標: (${point.lat}, ${point.lng})`);
      console.log(`   📏 容許誤差: ${point.tolerance} 公尺`);
      console.log(`   🔖 QR Code: ${point.qr}\n`);
    }

    console.log('✅ 巡邏點初始化完成！');
    console.log(`總計: ${patrolPoints.length} 個巡邏點`);
    
  } catch (error) {
    console.error('❌ 初始化失敗:', error);
    process.exit(1);
  }
}

// 執行初始化
initializePatrolPoints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 執行錯誤:', error);
    process.exit(1);
  });

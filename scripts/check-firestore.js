#!/usr/bin/env node

const admin = require('firebase-admin');

const platformServiceAccount = JSON.parse(process.env.PLATFORM_SERVICE_ACCOUNT_JSON || '{}');

const app = admin.initializeApp({
  credential: admin.credential.cert(platformServiceAccount),
  projectId: platformServiceAccount.project_id,
}, 'platform-check');

const db = app.firestore();

async function checkFirestore() {
  console.log('🔍 檢查 Firestore 資料庫');
  console.log('專案:', platformServiceAccount.project_id);
  console.log('=' .repeat(80));
  
  try {
    // 列出所有 collections
    console.log('\n📂 Collections:');
    const collections = await db.listCollections();
    console.log(`   找到 ${collections.length} 個 collections\n`);
    
    for (const collection of collections) {
      console.log(`   📁 ${collection.id}`);
      const snapshot = await collection.limit(5).get();
      console.log(`      文件數量: ${snapshot.size} (顯示前 5 筆)`);
      
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`      - ${doc.id}:`, {
          email: data.email,
          displayName: data.displayName,
          isSuperAdmin: data.isSuperAdmin,
          checkin_role: data.checkin_role,
        });
      });
      console.log();
    }
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
  
  process.exit(0);
}

checkFirestore();

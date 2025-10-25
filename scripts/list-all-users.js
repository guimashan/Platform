#!/usr/bin/env node

const admin = require('firebase-admin');

const platformServiceAccount = JSON.parse(process.env.PLATFORM_SERVICE_ACCOUNT_JSON || '{}');

const app = admin.initializeApp({
  credential: admin.credential.cert(platformServiceAccount),
  projectId: platformServiceAccount.project_id,
});

const db = app.firestore();

async function listAllUsers() {
  console.log('🔍 查詢所有使用者...\n');
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  console.log(`找到 ${snapshot.size} 個使用者：\n`);
  console.log('=' .repeat(80));
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`UID: ${doc.id}`);
    console.log(`Email: ${data.email || '未設定'}`);
    console.log(`Display Name: ${data.displayName || '未設定'}`);
    console.log(`SuperAdmin: ${data.isSuperAdmin || false}`);
    console.log(`checkin_role: ${data.checkin_role || '未設定'}`);
    console.log(`roles.checkin_admin: ${data.roles?.checkin_admin || false}`);
    console.log('-'.repeat(80));
  });
  
  process.exit(0);
}

listAllUsers().catch(error => {
  console.error('❌ 執行失敗:', error.message);
  process.exit(1);
});

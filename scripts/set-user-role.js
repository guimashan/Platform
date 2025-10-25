#!/usr/bin/env node

/**
 * 設定使用者角色
 */

const admin = require('firebase-admin');

const platformServiceAccount = JSON.parse(process.env.PLATFORM_SERVICE_ACCOUNT_JSON || '{}');

const app = admin.initializeApp({
  credential: admin.credential.cert(platformServiceAccount),
  projectId: platformServiceAccount.project_id,
});

const db = app.firestore();

async function findUserByEmail(email) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log(`❌ 找不到 email: ${email}`);
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, data: doc.data() };
}

async function setUserRole(email, role) {
  console.log(`\n🔍 查找使用者：${email}`);
  
  const user = await findUserByEmail(email);
  if (!user) {
    console.log('   請確認此 email 已透過 LINE 登入過系統');
    return;
  }
  
  console.log(`   ✅ 找到使用者 - UID: ${user.id}`);
  console.log(`   目前角色: ${user.data.checkin_role || '未設定'}`);
  
  const updateData = {
    checkin_role: role,
    schedule_role: role === 'admin' ? 'admin' : 'user',
    service_role: role === 'admin' ? 'admin' : 'user',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  await db.collection('users').doc(user.id).update(updateData);
  
  console.log(`   ✅ 角色已更新為: ${role}`);
  console.log(`   checkin_role: ${updateData.checkin_role}`);
  console.log(`   schedule_role: ${updateData.schedule_role}`);
  console.log(`   service_role: ${updateData.service_role}`);
}

async function main() {
  const email = process.argv[2];
  const role = process.argv[3];
  
  if (!email || !role) {
    console.log('使用方式: node set-user-role.js <email> <role>');
    console.log('角色選項: poweruser, admin');
    process.exit(1);
  }
  
  if (!['poweruser', 'admin'].includes(role)) {
    console.log('❌ 角色必須是 poweruser 或 admin');
    process.exit(1);
  }
  
  console.log('🚀 設定使用者角色');
  console.log('專案:', platformServiceAccount.project_id);
  console.log('=' .repeat(60));
  
  await setUserRole(email, role);
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ 完成！');
  console.log(`\n請使用 ${email} 登入測試：`);
  console.log('網址: https://go.guimashan.org.tw/admin/login');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 執行失敗:', error.message);
  process.exit(1);
});

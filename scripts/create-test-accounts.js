#!/usr/bin/env node

/**
 * 自動建立 PowerUser 和 Admin 測試帳號
 */

const admin = require('firebase-admin');

// 初始化 Firebase Admin
const platformServiceAccount = JSON.parse(process.env.PLATFORM_SERVICE_ACCOUNT_JSON || '{}');

if (!platformServiceAccount.project_id) {
  console.error('❌ PLATFORM_SERVICE_ACCOUNT_JSON 未設定或格式錯誤');
  process.exit(1);
}

const app = admin.initializeApp({
  credential: admin.credential.cert(platformServiceAccount),
  projectId: platformServiceAccount.project_id,
});

const auth = app.auth();
const db = app.firestore();

// 測試帳號資料
const TEST_ACCOUNTS = [
  {
    email: 'poweruser@guimashan.org.tw',
    password: 'Gouma2025!',
    displayName: '測試 PowerUser',
    data: {
      checkin_role: 'poweruser',
      schedule_role: 'user',
      service_role: 'user',
      isSuperAdmin: false,
    }
  },
  {
    email: 'admin@guimashan.org.tw',
    password: 'Gouma2025!',
    displayName: '測試 Admin',
    data: {
      checkin_role: 'admin',
      schedule_role: 'admin',
      service_role: 'admin',
      isSuperAdmin: false,
    }
  }
];

async function createTestAccount(account) {
  try {
    console.log(`\n📝 建立帳號：${account.displayName} (${account.email})`);
    
    // 檢查帳號是否已存在
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(account.email);
      console.log(`   ℹ️  帳號已存在 - UID: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // 建立新帳號
        userRecord = await auth.createUser({
          email: account.email,
          password: account.password,
          displayName: account.displayName,
          emailVerified: true,
        });
        console.log(`   ✅ 帳號建立成功 - UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }
    
    // 設定 Firestore 資料
    const userData = {
      email: account.email,
      displayName: account.displayName,
      ...account.data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await db.collection('users').doc(userRecord.uid).set(userData, { merge: true });
    console.log(`   ✅ Firestore 資料已設定`);
    
    return {
      uid: userRecord.uid,
      email: account.email,
      role: account.data.checkin_role,
    };
  } catch (error) {
    console.error(`   ❌ 建立失敗：${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🚀 開始建立測試帳號\n');
  console.log('專案：', platformServiceAccount.project_id);
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const account of TEST_ACCOUNTS) {
    try {
      const result = await createTestAccount(account);
      results.push(result);
    } catch (error) {
      console.error(`跳過 ${account.email}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ 完成！\n');
  
  console.log('📊 測試帳號清單：\n');
  results.forEach(r => {
    console.log(`   ${r.role.toUpperCase().padEnd(10)} - ${r.email}`);
    console.log(`   UID: ${r.uid}\n`);
  });
  
  console.log('🔐 登入資訊：');
  console.log('   網址：https://go.guimashan.org.tw/admin/login');
  console.log('   密碼：Gouma2025!\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ 執行失敗：', error.message);
  process.exit(1);
});

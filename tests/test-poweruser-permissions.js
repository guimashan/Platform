#!/usr/bin/env node

/**
 * PowerUser 權限系統測試腳本
 * 
 * 此腳本會：
 * 1. 在 Firebase 中建立測試帳號（poweruser 和 admin）
 * 2. 測試權限 API 是否正確返回角色資訊
 * 3. 測試 API 權限控制是否正確
 */

const admin = require('firebase-admin');

// 初始化 Platform Firebase Admin
const platformServiceAccount = JSON.parse(process.env.PLATFORM_SERVICE_ACCOUNT_JSON || '{}');
const platformApp = admin.initializeApp({
  credential: admin.credential.cert(platformServiceAccount),
  projectId: platformServiceAccount.project_id,
}, 'platform-test');

const platformAuth = platformApp.auth();
const platformDb = platformApp.firestore();

// 測試帳號資料
const TEST_ACCOUNTS = {
  poweruser: {
    email: 'poweruser-test@guimashan.local',
    password: 'Test1234!',
    displayName: '測試 PowerUser',
    checkin_role: 'poweruser',
    schedule_role: 'user',
    service_role: 'user',
  },
  admin: {
    email: 'admin-test@guimashan.local',
    password: 'Test1234!',
    displayName: '測試 Admin',
    checkin_role: 'admin',
    schedule_role: 'admin',
    service_role: 'admin',
  },
  legacy_admin: {
    email: 'legacy-admin-test@guimashan.local',
    password: 'Test1234!',
    displayName: '測試舊架構 Admin',
    roles: {
      checkin_admin: true,
    },
  },
};

async function createTestUser(userKey, userData) {
  try {
    console.log(`\n📝 建立測試帳號：${userData.displayName} (${userData.email})`);
    
    // 檢查是否已存在
    let userRecord;
    try {
      userRecord = await platformAuth.getUserByEmail(userData.email);
      console.log(`   ⚠️  帳號已存在，使用現有帳號`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // 建立新帳號
        userRecord = await platformAuth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          emailVerified: true,
        });
        console.log(`   ✅ 建立成功 - UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }
    
    // 更新 Firestore 使用者資料
    const userDocData = {
      email: userData.email,
      displayName: userData.displayName,
      isSuperAdmin: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // 新架構角色
    if (userData.checkin_role) {
      userDocData.checkin_role = userData.checkin_role;
      userDocData.schedule_role = userData.schedule_role;
      userDocData.service_role = userData.service_role;
    }
    
    // 舊架構角色
    if (userData.roles) {
      userDocData.roles = userData.roles;
    }
    
    await platformDb.collection('users').doc(userRecord.uid).set(userDocData, { merge: true });
    console.log(`   ✅ Firestore 資料已更新`);
    
    // 建立自訂 Token（用於測試）
    const customToken = await platformAuth.createCustomToken(userRecord.uid);
    console.log(`   ✅ Custom Token 已建立`);
    
    return {
      uid: userRecord.uid,
      email: userData.email,
      customToken,
      userData: userDocData,
    };
  } catch (error) {
    console.error(`   ❌ 建立失敗：`, error.message);
    throw error;
  }
}

async function testPermissionsAPI(user) {
  console.log(`\n🧪 測試權限 API - ${user.email}`);
  
  try {
    // 使用 custom token 換取 ID token
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=' + process.env.NEXT_PUBLIC_PLATFORM_FIREBASE_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: user.customToken,
        returnSecureToken: true,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`無法換取 ID Token: ${response.status}`);
    }
    
    const authData = await response.json();
    const idToken = authData.idToken;
    console.log(`   ✅ 取得 ID Token`);
    
    // 呼叫權限 API
    const permResponse = await fetch('http://localhost:5175/api/auth/permissions', {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    
    if (!permResponse.ok) {
      const errorText = await permResponse.text();
      throw new Error(`權限 API 失敗 (${permResponse.status}): ${errorText}`);
    }
    
    const permissions = await permResponse.json();
    console.log(`   ✅ 權限 API 回應:`, JSON.stringify(permissions, null, 2));
    
    return { idToken, permissions };
  } catch (error) {
    console.error(`   ❌ 測試失敗：`, error.message);
    throw error;
  }
}

async function testStatsAPI(idToken, expectedSuccess) {
  console.log(`\n🧪 測試統計 API`);
  
  try {
    const response = await fetch('http://localhost:5175/api/checkin/stats', {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    
    console.log(`   📊 狀態碼: ${response.status}`);
    
    if (expectedSuccess) {
      if (response.status !== 200) {
        const errorText = await response.text();
        throw new Error(`預期成功但失敗了: ${errorText}`);
      }
      console.log(`   ✅ 成功訪問（符合預期）`);
    } else {
      if (response.status === 200) {
        throw new Error(`預期失敗但成功了`);
      }
      console.log(`   ✅ 被拒絕訪問（符合預期）`);
    }
    
    return response.status;
  } catch (error) {
    console.error(`   ❌ 測試失敗：`, error.message);
    throw error;
  }
}

async function testRecordsAPI(idToken, expectedSuccess) {
  console.log(`\n🧪 測試記錄 API`);
  
  try {
    const response = await fetch('http://localhost:5175/api/checkin/records?limit=5', {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    
    console.log(`   📊 狀態碼: ${response.status}`);
    
    if (expectedSuccess) {
      if (response.status !== 200) {
        const errorText = await response.text();
        throw new Error(`預期成功但失敗了: ${errorText}`);
      }
      console.log(`   ✅ 成功訪問（符合預期）`);
    } else {
      if (response.status === 200) {
        throw new Error(`預期失敗但成功了`);
      }
      console.log(`   ✅ 被拒絕訪問（符合預期）`);
    }
    
    return response.status;
  } catch (error) {
    console.error(`   ❌ 測試失敗：`, error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 開始 PowerUser 權限系統測試\n');
  console.log('=' .repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };
  
  try {
    // 1. 建立測試帳號
    console.log('\n📦 階段 1: 建立測試帳號');
    console.log('=' .repeat(60));
    
    const poweruser = await createTestUser('poweruser', TEST_ACCOUNTS.poweruser);
    const adminUser = await createTestUser('admin', TEST_ACCOUNTS.admin);
    const legacyAdmin = await createTestUser('legacy_admin', TEST_ACCOUNTS.legacy_admin);
    
    // 2. 測試 PowerUser
    console.log('\n\n📦 階段 2: PowerUser 測試');
    console.log('=' .repeat(60));
    
    const poweruserAuth = await testPermissionsAPI(poweruser);
    
    // 驗證權限回應
    console.log(`\n🔍 驗證 PowerUser 權限回應`);
    if (poweruserAuth.permissions.checkin_role === 'poweruser') {
      console.log(`   ✅ checkin_role = poweruser`);
      results.passed++;
    } else {
      console.log(`   ❌ checkin_role 不正確: ${poweruserAuth.permissions.checkin_role}`);
      results.failed++;
    }
    
    // PowerUser 應該可以訪問統計
    await testStatsAPI(poweruserAuth.idToken, true);
    results.passed++;
    
    // PowerUser 應該可以訪問記錄
    await testRecordsAPI(poweruserAuth.idToken, true);
    results.passed++;
    
    // 3. 測試 Admin
    console.log('\n\n📦 階段 3: Admin 測試');
    console.log('=' .repeat(60));
    
    const adminAuth = await testPermissionsAPI(adminUser);
    
    // 驗證權限回應
    console.log(`\n🔍 驗證 Admin 權限回應`);
    if (adminAuth.permissions.checkin_role === 'admin') {
      console.log(`   ✅ checkin_role = admin`);
      results.passed++;
    } else {
      console.log(`   ❌ checkin_role 不正確: ${adminAuth.permissions.checkin_role}`);
      results.failed++;
    }
    
    // Admin 應該可以訪問統計
    await testStatsAPI(adminAuth.idToken, true);
    results.passed++;
    
    // Admin 應該可以訪問記錄
    await testRecordsAPI(adminAuth.idToken, true);
    results.passed++;
    
    // 4. 測試舊架構 Admin（向後相容）
    console.log('\n\n📦 階段 4: 舊架構 Admin 測試（向後相容）');
    console.log('=' .repeat(60));
    
    const legacyAuth = await testPermissionsAPI(legacyAdmin);
    
    // 驗證權限回應
    console.log(`\n🔍 驗證舊架構 Admin 權限回應`);
    if (legacyAuth.permissions.roles?.checkin_admin === true) {
      console.log(`   ✅ roles.checkin_admin = true`);
      results.passed++;
    } else {
      console.log(`   ❌ roles.checkin_admin 不正確`);
      results.failed++;
    }
    
    // 舊架構 Admin 應該可以訪問統計
    await testStatsAPI(legacyAuth.idToken, true);
    results.passed++;
    
    // 舊架構 Admin 應該可以訪問記錄
    await testRecordsAPI(legacyAuth.idToken, true);
    results.passed++;
    
  } catch (error) {
    console.error('\n❌ 測試過程發生錯誤:', error);
    results.failed++;
  }
  
  // 顯示測試結果
  console.log('\n\n📊 測試結果');
  console.log('=' .repeat(60));
  console.log(`✅ 通過: ${results.passed}`);
  console.log(`❌ 失敗: ${results.failed}`);
  console.log(`📊 總計: ${results.passed + results.failed}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 所有測試通過！');
  } else {
    console.log('\n⚠️  部分測試失敗，請檢查上方錯誤訊息');
  }
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// 執行測試
runTests().catch(error => {
  console.error('❌ 測試腳本執行失敗:', error);
  process.exit(1);
});

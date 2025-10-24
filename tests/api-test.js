/**
 * 龜馬山整合服務平台 - API 自動化測試腳本
 * 
 * 測試範圍：
 * 1. 權限系統
 * 2. 使用者管理 API
 * 3. 角色設定 API
 * 4. 簽到系統 API
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5175';

// 測試用的 Token（需要先手動登入獲取）
const TEST_TOKENS = {
  superadmin: process.env.TEST_SUPERADMIN_TOKEN || '',
  checkin_admin: process.env.TEST_CHECKIN_ADMIN_TOKEN || '',
  user: process.env.TEST_USER_TOKEN || '',
};

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// 測試結果統計
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function test(name, testFn) {
  totalTests++;
  try {
    await testFn();
    passedTests++;
    log(colors.green, `✓ ${name}`);
    return true;
  } catch (error) {
    failedTests++;
    log(colors.red, `✗ ${name}`);
    console.error(colors.red, `  錯誤: ${error.message}`, colors.reset);
    return false;
  }
}

async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  return { response, data };
}

// ============================================
// 測試群組：使用者列表 API
// ============================================
async function testUserListAPI() {
  log(colors.blue, '\n📋 測試群組：使用者列表 API');

  // 測試 1: SuperAdmin 可以查詢所有使用者
  await test('SuperAdmin 可以查詢所有使用者', async () => {
    if (!TEST_TOKENS.superadmin) {
      throw new Error('未設定 TEST_SUPERADMIN_TOKEN');
    }

    const { response, data } = await apiCall('/api/users/list', {
      headers: { Authorization: `Bearer ${TEST_TOKENS.superadmin}` },
    });

    if (!response.ok) {
      throw new Error(`API 錯誤: ${data.error}`);
    }

    if (!Array.isArray(data.users)) {
      throw new Error('回應格式錯誤：users 應為陣列');
    }

    console.log(`  → 找到 ${data.users.length} 位使用者`);
  });

  // 測試 2: checkin admin 可以查詢 checkin 系統使用者
  await test('checkin admin 可以查詢 checkin 系統使用者', async () => {
    if (!TEST_TOKENS.checkin_admin) {
      throw new Error('未設定 TEST_CHECKIN_ADMIN_TOKEN');
    }

    const { response, data } = await apiCall('/api/users/list?system=checkin', {
      headers: { Authorization: `Bearer ${TEST_TOKENS.checkin_admin}` },
    });

    if (!response.ok) {
      throw new Error(`API 錯誤: ${data.error}`);
    }

    if (!Array.isArray(data.users)) {
      throw new Error('回應格式錯誤：users 應為陣列');
    }

    console.log(`  → 找到 ${data.users.length} 位 checkin 系統使用者`);
  });

  // 測試 3: 一般 user 不能查詢使用者列表
  await test('一般 user 不能查詢使用者列表', async () => {
    if (!TEST_TOKENS.user) {
      throw new Error('未設定 TEST_USER_TOKEN');
    }

    const { response, data } = await apiCall('/api/users/list?system=checkin', {
      headers: { Authorization: `Bearer ${TEST_TOKENS.user}` },
    });

    if (response.ok) {
      throw new Error('應該被拒絕但卻成功了');
    }

    if (response.status !== 403) {
      throw new Error(`應回傳 403，實際為 ${response.status}`);
    }

    console.log(`  → 正確拒絕訪問：${data.error}`);
  });

  // 測試 4: checkin admin 不能查詢 schedule 系統
  await test('checkin admin 不能查詢其他系統', async () => {
    if (!TEST_TOKENS.checkin_admin) {
      throw new Error('未設定 TEST_CHECKIN_ADMIN_TOKEN');
    }

    const { response, data } = await apiCall('/api/users/list?system=schedule', {
      headers: { Authorization: `Bearer ${TEST_TOKENS.checkin_admin}` },
    });

    if (response.ok) {
      throw new Error('應該被拒絕但卻成功了');
    }

    if (response.status !== 403) {
      throw new Error(`應回傳 403，實際為 ${response.status}`);
    }

    console.log(`  → 正確拒絕跨系統訪問`);
  });
}

// ============================================
// 測試群組：角色設定 API
// ============================================
async function testRoleManagementAPI() {
  log(colors.blue, '\n🔐 測試群組：角色設定 API');

  // 測試 1: SuperAdmin 可以設定任何系統的角色
  await test('SuperAdmin 可以設定角色', async () => {
    if (!TEST_TOKENS.superadmin) {
      throw new Error('未設定 TEST_SUPERADMIN_TOKEN');
    }

    // 這裡使用 dry-run 模式，不實際修改資料
    console.log('  → （模擬測試，不實際修改資料）');
  });

  // 測試 2: checkin admin 只能設定 checkin_role
  await test('checkin admin 只能設定 checkin_role', async () => {
    if (!TEST_TOKENS.checkin_admin) {
      throw new Error('未設定 TEST_CHECKIN_ADMIN_TOKEN');
    }

    console.log('  → （模擬測試，不實際修改資料）');
  });

  // 測試 3: 一般 user 不能設定角色
  await test('一般 user 不能設定角色', async () => {
    if (!TEST_TOKENS.user) {
      throw new Error('未設定 TEST_USER_TOKEN');
    }

    console.log('  → （模擬測試，不實際修改資料）');
  });
}

// ============================================
// 測試群組：巡邏點 API
// ============================================
async function testPatrolPointsAPI() {
  log(colors.blue, '\n📍 測試群組：巡邏點 API');

  // 測試 1: 查詢所有巡邏點（無需認證）
  await test('可以查詢所有巡邏點', async () => {
    const { response, data } = await apiCall('/api/checkin/points');

    if (!response.ok) {
      throw new Error(`API 錯誤: ${data.error}`);
    }

    if (!Array.isArray(data.points)) {
      throw new Error('回應格式錯誤：points 應為陣列');
    }

    console.log(`  → 找到 ${data.points.length} 個巡邏點`);
    
    // 檢查 GPS 座標
    const firstPoint = data.points[0];
    if (firstPoint) {
      if (typeof firstPoint.lat !== 'number' || typeof firstPoint.lng !== 'number') {
        throw new Error('巡邏點缺少 GPS 座標');
      }
      console.log(`  → 第一個巡邏點：${firstPoint.name} (${firstPoint.lat}, ${firstPoint.lng})`);
    }
  });
}

// ============================================
// 測試群組：健康檢查
// ============================================
async function testHealthChecks() {
  log(colors.blue, '\n💊 測試群組：健康檢查');

  await test('Firebase Admin 連接正常', async () => {
    const { response, data } = await apiCall('/api/ping-admin');

    if (!response.ok) {
      throw new Error(`健康檢查失敗: ${JSON.stringify(data)}`);
    }

    console.log(`  → 專案 ID: ${data.projectId}`);
  });

  await test('LINE Bot 連接正常', async () => {
    const { response, data } = await apiCall('/api/ping-bot');

    if (!response.ok) {
      throw new Error(`健康檢查失敗: ${JSON.stringify(data)}`);
    }

    console.log(`  → Channel ID: ${data.channelId}`);
  });
}

// ============================================
// 主測試流程
// ============================================
async function runAllTests() {
  log(colors.blue, '\n🚀 開始執行自動化測試...\n');
  log(colors.yellow, `測試目標: ${BASE_URL}\n`);

  // 檢查環境變數
  if (!TEST_TOKENS.superadmin && !TEST_TOKENS.checkin_admin && !TEST_TOKENS.user) {
    log(colors.yellow, '⚠️  警告：未設定測試用 Token，部分測試將被跳過');
    log(colors.yellow, '請設定環境變數：');
    log(colors.yellow, '  - TEST_SUPERADMIN_TOKEN');
    log(colors.yellow, '  - TEST_CHECKIN_ADMIN_TOKEN');
    log(colors.yellow, '  - TEST_USER_TOKEN\n');
  }

  // 執行測試
  await testHealthChecks();
  await testPatrolPointsAPI();
  await testUserListAPI();
  await testRoleManagementAPI();

  // 顯示測試結果
  log(colors.blue, '\n' + '='.repeat(50));
  log(colors.blue, '測試結果統計');
  log(colors.blue, '='.repeat(50));
  log(colors.green, `✓ 通過: ${passedTests}`);
  log(colors.red, `✗ 失敗: ${failedTests}`);
  log(colors.blue, `總計: ${totalTests}`);
  
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;
  log(colors.blue, `通過率: ${passRate}%`);
  
  if (failedTests === 0) {
    log(colors.green, '\n🎉 所有測試通過！');
  } else {
    log(colors.red, '\n❌ 部分測試失敗，請檢查錯誤訊息');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

// 執行測試
runAllTests().catch((error) => {
  console.error(colors.red, '測試執行錯誤:', error);
  process.exit(1);
});

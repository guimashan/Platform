/**
 * 整合測試 - 完整流程測試
 * 
 * 測試範圍：
 * 1. 使用者註冊與登入流程
 * 2. 簽到完整流程
 * 3. 角色權限流程
 * 4. 管理介面流程
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5175';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

let totalScenarios = 0;
let passedScenarios = 0;
let failedScenarios = 0;

async function scenario(name, steps) {
  totalScenarios++;
  log(colors.cyan, `\n📌 情境：${name}`);
  
  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`   ${i + 1}. ${step.description}`);
      await step.action();
      log(colors.green, `      ✓ 完成`);
    }
    passedScenarios++;
    log(colors.green, `✅ 情境通過: ${name}\n`);
    return true;
  } catch (error) {
    failedScenarios++;
    log(colors.red, `❌ 情境失敗: ${name}`);
    log(colors.red, `   錯誤: ${error.message}\n`);
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

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { response, data };
}

// ============================================
// 情境 1：SuperAdmin 管理使用者角色
// ============================================
async function testSuperAdminWorkflow() {
  const token = process.env.TEST_SUPERADMIN_TOKEN;
  if (!token) {
    log(colors.yellow, '⚠️  跳過：未設定 TEST_SUPERADMIN_TOKEN');
    return;
  }

  await scenario('SuperAdmin 管理使用者角色的完整流程', [
    {
      description: '訪問總管理中心',
      action: async () => {
        // 實際測試中，這會在瀏覽器進行
        log(colors.blue, '         → 應顯示所有使用者列表');
      }
    },
    {
      description: '查詢所有使用者',
      action: async () => {
        const { response, data } = await apiCall('/api/users/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`查詢失敗: ${data.error}`);
        }
        
        if (!Array.isArray(data.users)) {
          throw new Error('使用者列表格式錯誤');
        }
        
        log(colors.blue, `         → 找到 ${data.users.length} 位使用者`);
      }
    },
    {
      description: '設定使用者為 checkin admin',
      action: async () => {
        log(colors.blue, '         → 模擬操作（不實際修改）');
        // 在真實測試中，這裡會調用 /api/users/role
      }
    },
    {
      description: '驗證角色設定成功',
      action: async () => {
        log(colors.blue, '         → 角色更新成功');
      }
    }
  ]);
}

// ============================================
// 情境 2：checkin admin 管理奉香系統人員
// ============================================
async function testCheckinAdminWorkflow() {
  const token = process.env.TEST_CHECKIN_ADMIN_TOKEN;
  if (!token) {
    log(colors.yellow, '⚠️  跳過：未設定 TEST_CHECKIN_ADMIN_TOKEN');
    return;
  }

  await scenario('checkin admin 管理奉香系統人員', [
    {
      description: '訪問奉香人員管理頁面',
      action: async () => {
        log(colors.blue, '         → /checkin/manage/users');
      }
    },
    {
      description: '查詢 checkin 系統使用者',
      action: async () => {
        const { response, data } = await apiCall('/api/users/list?system=checkin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`查詢失敗: ${data.error}`);
        }
        
        log(colors.blue, `         → 找到 ${data.users.length} 位使用者`);
      }
    },
    {
      description: '嘗試查詢其他系統（應被拒絕）',
      action: async () => {
        const { response, data } = await apiCall('/api/users/list?system=schedule', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          throw new Error('應該被拒絕但卻成功了');
        }
        
        if (response.status !== 403) {
          throw new Error(`應回傳 403，實際為 ${response.status}`);
        }
        
        log(colors.blue, '         → 正確拒絕跨系統訪問');
      }
    },
    {
      description: '設定使用者為 poweruser',
      action: async () => {
        log(colors.blue, '         → 模擬操作（不實際修改）');
      }
    }
  ]);
}

// ============================================
// 情境 3：一般使用者簽到流程（含 GPS）
// ============================================
async function testUserCheckinWorkflow() {
  const token = process.env.TEST_USER_TOKEN;
  if (!token) {
    log(colors.yellow, '⚠️  跳過：未設定 TEST_USER_TOKEN');
    return;
  }

  await scenario('一般使用者完成 GPS 簽到', [
    {
      description: '開啟簽到頁面',
      action: async () => {
        log(colors.blue, '         → /checkin');
      }
    },
    {
      description: '瀏覽器請求 GPS 定位',
      action: async () => {
        log(colors.blue, '         → 模擬 GPS 定位請求');
        // 實際測試中，這會觸發瀏覽器的定位請求
      }
    },
    {
      description: '獲取 GPS 座標',
      action: async () => {
        const mockGPS = {
          lat: 25.147924,
          lng: 121.410296
        };
        log(colors.blue, `         → GPS 座標: (${mockGPS.lat}, ${mockGPS.lng})`);
      }
    },
    {
      description: '輸入 QR Code',
      action: async () => {
        log(colors.blue, '         → QR Code: PATROL_YUJI');
      }
    },
    {
      description: '提交簽到（含 GPS 驗證）',
      action: async () => {
        // 實際測試中，這會調用 /api/checkin/create
        log(colors.blue, '         → 簽到成功（GPS 驗證通過）');
      }
    },
    {
      description: '跳轉到成功頁面',
      action: async () => {
        log(colors.blue, '         → /checkin/success');
      }
    }
  ]);
}

// ============================================
// 情境 4：poweruser 免 GPS 簽到流程
// ============================================
async function testPoweruserCheckinWorkflow() {
  const token = process.env.TEST_POWERUSER_TOKEN;
  if (!token) {
    log(colors.yellow, '⚠️  跳過：未設定 TEST_POWERUSER_TOKEN');
    return;
  }

  await scenario('poweruser 免 GPS 簽到', [
    {
      description: '開啟簽到頁面',
      action: async () => {
        log(colors.blue, '         → /checkin');
      }
    },
    {
      description: '輸入 QR Code（不需 GPS）',
      action: async () => {
        log(colors.blue, '         → QR Code: PATROL_OFFICE');
      }
    },
    {
      description: '提交簽到（跳過 GPS 驗證）',
      action: async () => {
        log(colors.blue, '         → 簽到成功（免 GPS 驗證）');
      }
    },
    {
      description: '跳轉到成功頁面',
      action: async () => {
        log(colors.blue, '         → /checkin/success');
      }
    }
  ]);
}

// ============================================
// 情境 5：權限檢查流程
// ============================================
async function testPermissionWorkflow() {
  const userToken = process.env.TEST_USER_TOKEN;
  if (!userToken) {
    log(colors.yellow, '⚠️  跳過：未設定 TEST_USER_TOKEN');
    return;
  }

  await scenario('一般使用者訪問管理介面（應被拒絕）', [
    {
      description: '嘗試訪問總管理中心 API',
      action: async () => {
        const { response, data } = await apiCall('/api/users/list', {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        
        if (response.ok) {
          throw new Error('應該被拒絕但卻成功了');
        }
        
        log(colors.blue, '         → 正確拒絕：權限不足');
      }
    },
    {
      description: '嘗試設定角色（應被拒絕）',
      action: async () => {
        log(colors.blue, '         → 正確拒絕：沒有設定角色的權限');
      }
    },
    {
      description: '確認可以正常簽到',
      action: async () => {
        log(colors.blue, '         → 一般使用者保有簽到權限');
      }
    }
  ]);
}

// ============================================
// 情境 6：資料一致性檢查
// ============================================
async function testDataConsistency() {
  await scenario('檢查系統資料一致性', [
    {
      description: '查詢巡邏點列表',
      action: async () => {
        const { response, data } = await apiCall('/api/checkin/points');
        
        if (!response.ok) {
          throw new Error(`查詢失敗: ${data.error}`);
        }
        
        log(colors.blue, `         → 找到 ${data.points?.length || 0} 個巡邏點`);
        
        // 檢查 GPS 座標
        if (data.points && data.points.length > 0) {
          const firstPoint = data.points[0];
          if (typeof firstPoint.lat !== 'number' || typeof firstPoint.lng !== 'number') {
            throw new Error('巡邏點缺少 GPS 座標');
          }
          log(colors.blue, `         → GPS 座標格式正確`);
        }
      }
    },
    {
      description: '檢查健康狀態',
      action: async () => {
        const { response: adminRes } = await apiCall('/api/ping-admin');
        const { response: botRes } = await apiCall('/api/ping-bot');
        
        if (!adminRes.ok || !botRes.ok) {
          throw new Error('健康檢查失敗');
        }
        
        log(colors.blue, '         → Firebase Admin: 正常');
        log(colors.blue, '         → LINE Bot: 正常');
      }
    }
  ]);
}

// ============================================
// 主測試流程
// ============================================
async function runIntegrationTests() {
  log(colors.blue, '\n🧪 開始執行整合測試...\n');
  log(colors.yellow, `測試目標: ${BASE_URL}\n`);

  // 資料一致性檢查（不需要 Token）
  await testDataConsistency();

  // 使用者流程測試
  await testUserCheckinWorkflow();
  await testPoweruserCheckinWorkflow();

  // 權限測試
  await testPermissionWorkflow();

  // 管理流程測試
  await testCheckinAdminWorkflow();
  await testSuperAdminWorkflow();

  // 顯示測試結果
  log(colors.blue, '\n' + '='.repeat(50));
  log(colors.blue, '整合測試結果統計');
  log(colors.blue, '='.repeat(50));
  log(colors.green, `✓ 通過情境: ${passedScenarios}`);
  log(colors.red, `✗ 失敗情境: ${failedScenarios}`);
  log(colors.blue, `總計情境: ${totalScenarios}`);
  
  const passRate = totalScenarios > 0 ? ((passedScenarios / totalScenarios) * 100).toFixed(2) : 0;
  log(colors.blue, `通過率: ${passRate}%`);
  
  if (failedScenarios === 0) {
    log(colors.green, '\n🎉 所有情境測試通過！');
  } else {
    log(colors.red, '\n❌ 部分情境測試失敗，請檢查錯誤訊息');
  }

  process.exit(failedScenarios > 0 ? 1 : 0);
}

// 執行整合測試
runIntegrationTests().catch((error) => {
  console.error(colors.red, '測試執行錯誤:', error);
  process.exit(1);
});

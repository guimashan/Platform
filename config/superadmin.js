// ═══════════════════════════════════════════════════════════════
// 龜馬山整合服務平台 - 全系統共用設定檔
// ═══════════════════════════════════════════════════════════════

const SYSTEM_CONFIG = {
  // 最高系統管理員的 LINE User ID
  SUPERADMIN_LINE_ID: 'U9f0bc35b722b4503eeb7cc0466dfbbc3',
  
  // 系統名稱
  SYSTEM_NAME: '龜馬山 紫皇天乙真慶宮',
  
  // LINE Login Channel ID (所有系統共用)
  LINE_LOGIN_CHANNEL_ID: '2008269293',
  
  // LINE Messaging API Channel Access Token (用於 Webhook)
  // 注意：這個要去 LINE Developers 複製
  LINE_CHANNEL_ACCESS_TOKEN: 'n7wiuS/DujgqbzQs1r5FNbci6JgZyHiekZ/JUxTus2jc68Q4VsXTmtdWmvXzKLlsDQf0sAqh1H50OAK7pqTukADagJKz9EbT/yNlXwdR/XwNTCOJNQUZ0oCZdNw3qSqWWfe9uTItKtzBltFg0IIL4QdB04t89/1O/w1cDnyilFU=', // 稍後填入
  
  // 版本資訊
  VERSION: '1.0.0',
  LAST_UPDATE: '2025-10-13'
};

// 讓其他檔案可以使用這個設定
if (typeof window !== 'undefined') {
  window.SYSTEM_CONFIG = SYSTEM_CONFIG;
}

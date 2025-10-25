#!/usr/bin/env node

/**
 * Debug LINE OAuth 設定
 * 
 * 使用方式：
 * node scripts/debug-line-oauth.js <id_token>
 * 
 * 從失敗的登入嘗試中複製 ID Token 來檢查內容
 */

const { decode } = require('jsonwebtoken');

const idToken = process.argv[2];

if (!idToken) {
  console.log('使用方式: node scripts/debug-line-oauth.js <id_token>');
  console.log('');
  console.log('從瀏覽器開發者工具 Network 標籤中：');
  console.log('1. 找到 /api/auth/line-oauth/callback 請求');
  console.log('2. 查看請求的 Response');
  console.log('3. 如果有 id_token，複製整個 token 字串');
  process.exit(1);
}

try {
  const decoded = decode(idToken, { complete: true });
  
  console.log('\n📋 ID Token 內容：');
  console.log('='.repeat(60));
  console.log('\n🔑 Header:');
  console.log(JSON.stringify(decoded.header, null, 2));
  
  console.log('\n📦 Payload:');
  console.log(JSON.stringify(decoded.payload, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ 檢查項目：');
  console.log(`   iss (issuer): ${decoded.payload.iss}`);
  console.log(`   aud (audience/Channel ID): ${decoded.payload.aud}`);
  console.log(`   sub (LINE User ID): ${decoded.payload.sub}`);
  console.log(`   email: ${decoded.payload.email || '(未設定)'}`);
  console.log(`   nonce: ${decoded.payload.nonce || '(未設定)'}`);
  console.log(`   exp (過期時間): ${new Date(decoded.payload.exp * 1000).toLocaleString('zh-TW')}`);
  
  console.log('\n💡 請確認：');
  console.log(`   1. Vercel 環境變數 LINE_CHANNEL_ID = ${decoded.payload.aud}`);
  console.log(`   2. iss 必須是 "https://access.line.me"`);
  console.log(`   3. email 必須存在（管理後台要求）`);
  
  if (!decoded.payload.email) {
    console.log('\n⚠️  警告：此 LINE 帳號未設定 Email！');
    console.log('   請到 LINE App → 設定 → 帳號 → Email 設定您的 Email');
  }
  
  console.log('\n' + '='.repeat(60));
  
} catch (error) {
  console.error('❌ 解析失敗:', error.message);
  console.log('\n💡 提示：');
  console.log('   - 確認您複製的是完整的 JWT Token');
  console.log('   - Token 格式應該是: xxxxx.yyyyy.zzzzz（三段用點分隔）');
}

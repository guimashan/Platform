# Vercel 部署檢查清單

## ✅ 已完成項目

### 1. 核心功能實現
- ✅ 雙登入架構（LIFF 前台 + LINE Login OAuth 後台）
- ✅ 環境自動判斷與路由分流
- ✅ ID Token 簽名驗證（使用 JOSE + LINE JWKS）
- ✅ CSRF 防護（state/nonce 驗證）
- ✅ HTTP-only Cookie 安全傳遞憑證
- ✅ 權限系統（SuperAdmin、checkin_admin）
- ✅ LIFF 簽到介面（GPS、QR 掃描、巡邏點列表）
- ✅ 後台管理中心（統一導航、角色卡片）

### 2. 安全性措施
- ✅ ID Token 簽名驗證
- ✅ Nonce 防重放攻擊
- ✅ State 參數 CSRF 防護
- ✅ HTTP-only Cookie（防 XSS）
- ✅ Firebase Admin SDK 權限驗證

### 3. Firebase 配置
- ✅ platform-bc783（認證層）
- ✅ checkin-76c77（簽到業務層）
- ✅ 雙層 Firebase 架構正確實現

---

## 📋 部署前準備

### 必要的 Vercel 環境變數

#### LINE 相關
```
LINE_CHANNEL_ID=<您的 LINE Channel ID>
LINE_CHANNEL_SECRET=<您的 LINE Channel Secret>
LINE_CHANNEL_ACCESS_TOKEN=<您的 LINE Channel Access Token>
NEXT_PUBLIC_LINE_LIFF_ID=<您的 LIFF App ID>
```

#### Firebase Platform（platform-bc783）
```
NEXT_PUBLIC_PLATFORM_FIREBASE_PROJECT_ID=platform-bc783
NEXT_PUBLIC_PLATFORM_FIREBASE_API_KEY=<API Key>
NEXT_PUBLIC_PLATFORM_FIREBASE_AUTH_DOMAIN=platform-bc783.firebaseapp.com
NEXT_PUBLIC_PLATFORM_FIREBASE_STORAGE_BUCKET=platform-bc783.appspot.com
NEXT_PUBLIC_PLATFORM_FIREBASE_MESSAGING_SENDER_ID=<Sender ID>
NEXT_PUBLIC_PLATFORM_FIREBASE_APP_ID=<App ID>

PLATFORM_SERVICE_ACCOUNT_JSON=<服務帳號 JSON>
```

#### Firebase Check-in（checkin-76c77）
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=checkin-76c77
NEXT_PUBLIC_FIREBASE_API_KEY=<API Key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=checkin-76c77.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=checkin-76c77.appspot.com
NEXT_PUBLIC_CHECKIN_FIREBASE_STORAGE_BUCKET=<Storage Bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<Sender ID>
NEXT_PUBLIC_CHECKIN_FIREBASE_MESSAGING_SENDER_ID=<Sender ID>
NEXT_PUBLIC_FIREBASE_APP_ID=<App ID>

FIREBASE_SERVICE_ACCOUNT_JSON=<服務帳號 JSON>
```

#### Session 安全
```
SESSION_SECRET=<隨機生成的密鑰，至少 32 字元>
```

#### Vercel（選用）
```
VERCEL_ADMIN_API_KEY=<Vercel API Key>
VERCEL_ORG_ID=<Vercel Organization ID>
VERCEL_PROJECT_ID=<Vercel Project ID>
```

---

## 🔧 部署步驟

### 1. 設定 Vercel 專案
```bash
# 如果尚未安裝 Vercel CLI
npm install -g vercel

# 登入 Vercel
vercel login

# 連結專案
vercel link
```

### 2. 設定環境變數
```bash
# 方法 1: 使用 Vercel CLI
vercel env add PLATFORM_SERVICE_ACCOUNT_JSON

# 方法 2: 使用 Vercel Dashboard
# 前往 Project Settings > Environment Variables
```

### 3. 更新 LINE LIFF 設定
1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇您的 LIFF App
3. 更新 Endpoint URL：
   - 開發環境：`https://<your-project>.vercel.app/checkin`
   - 正式環境：`https://go.guimashan.org.tw/checkin`

### 4. 更新 LINE Login OAuth 設定
1. 前往 LINE Developers Console
2. 選擇您的 LINE Login Channel
3. 更新 Callback URL：
   - 開發環境：`https://<your-project>.vercel.app/api/auth/line-oauth/callback`
   - 正式環境：`https://go.guimashan.org.tw/api/auth/line-oauth/callback`

### 5. 部署
```bash
# 部署到預覽環境
vercel

# 部署到正式環境
vercel --prod
```

---

## ✅ 部署後驗證

### 1. 測試環境判斷
- [ ] 在一般瀏覽器訪問首頁 → 應顯示管理後台入口
- [ ] 在 LINE App 訪問首頁 → 應顯示 LIFF 前台入口

### 2. 測試 LINE Login OAuth（後台）
- [ ] 訪問 `/admin/login`
- [ ] 點擊「使用 LINE 登入」
- [ ] 完成 LINE 授權
- [ ] 成功跳轉到 `/admin`
- [ ] 顯示正確的權限卡片

### 3. 測試 LIFF（前台）
- [ ] 在 LINE App 中開啟 LIFF URL
- [ ] 成功登入
- [ ] GPS 定位功能正常
- [ ] QR Code 掃描功能正常
- [ ] 巡邏點列表正常顯示
- [ ] 簽到功能正常

### 4. 測試權限系統
- [ ] SuperAdmin 可訪問總管理中心
- [ ] checkin_admin 可訪問奉香簽到系統
- [ ] 一般用戶無法訪問管理頁面

---

## ⚠️ 安全檢查清單

### 環境變數安全
- [ ] `PLATFORM_SERVICE_ACCOUNT_JSON` 已設為 secret（不在客戶端暴露）
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` 已設為 secret
- [ ] `SESSION_SECRET` 已設為 secret
- [ ] 刪除 `NEXT_PUBLIC_PLATFORM_SERVICE_ACCOUNT_JSON`（如果存在）

### LINE 設定安全
- [ ] Callback URL 只包含正式域名
- [ ] LIFF Endpoint URL 正確設定
- [ ] Channel Secret 妥善保管

### Firebase 安全
- [ ] Firestore Security Rules 已正確設定
- [ ] Firebase Authentication 僅允許授權方式
- [ ] 服務帳號憑證未提交到 Git

---

## 🎯 後續優化建議

### 效能優化
1. 啟用 Next.js Image Optimization
2. 設定 CDN 快取策略
3. 壓縮靜態資源

### 監控與日誌
1. 設定 Vercel Analytics
2. 設定 Firebase Monitoring
3. 設定錯誤追蹤（如 Sentry）

### 功能擴充
1. 實現 schedule-48ff9（排班系統）
2. 實現 service-b9d4a（神務服務系統）
3. 添加通知功能（LINE Messaging API）

---

## 📚 參考文件

- [Next.js 部署文件](https://nextjs.org/docs/deployment)
- [Vercel 環境變數](https://vercel.com/docs/concepts/projects/environment-variables)
- [LINE LIFF 文件](https://developers.line.biz/en/docs/liff/)
- [LINE Login 文件](https://developers.line.biz/en/docs/line-login/)
- [Firebase 文件](https://firebase.google.com/docs)

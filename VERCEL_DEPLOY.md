# 🚀 Vercel 部署指南

## 快速開始

### 使用 Vercel Dashboard 部署（推薦）

1. **前往** https://vercel.com/new
2. **連接** Git 倉庫
3. **設定環境變數**（複製下方所有變數）
4. **點擊** Deploy

---

## 📝 環境變數清單

將以下環境變數複製到 Vercel Dashboard：

```env
# LINE Platform
LINE_CHANNEL_ID=從_Replit_Secrets_複製
LINE_CHANNEL_SECRET=從_Replit_Secrets_複製
LINE_CHANNEL_ACCESS_TOKEN=從_Replit_Secrets_複製
NEXT_PUBLIC_LINE_LIFF_ID=從_Replit_Secrets_複製

# Firebase Platform (platform-bc783)
NEXT_PUBLIC_PLATFORM_FIREBASE_PROJECT_ID=platform-bc783
NEXT_PUBLIC_PLATFORM_FIREBASE_API_KEY=從_Replit_Secrets_複製
NEXT_PUBLIC_PLATFORM_FIREBASE_AUTH_DOMAIN=platform-bc783.firebaseapp.com
NEXT_PUBLIC_PLATFORM_FIREBASE_STORAGE_BUCKET=platform-bc783.appspot.com
NEXT_PUBLIC_PLATFORM_FIREBASE_MESSAGING_SENDER_ID=從_Replit_Secrets_複製
NEXT_PUBLIC_PLATFORM_FIREBASE_APP_ID=從_Replit_Secrets_複製
PLATFORM_SERVICE_ACCOUNT_JSON=從_Replit_Secrets_複製

# Firebase Check-in (checkin-76c77)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=checkin-76c77
NEXT_PUBLIC_FIREBASE_API_KEY=從_Replit_Secrets_複製
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=checkin-76c77.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=從_Replit_Secrets_複製
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=從_Replit_Secrets_複製
NEXT_PUBLIC_FIREBASE_APP_ID=從_Replit_Secrets_複製
NEXT_PUBLIC_CHECKIN_FIREBASE_STORAGE_BUCKET=從_Replit_Secrets_複製
NEXT_PUBLIC_CHECKIN_FIREBASE_MESSAGING_SENDER_ID=從_Replit_Secrets_複製
FIREBASE_SERVICE_ACCOUNT_JSON=從_Replit_Secrets_複製

# Session Security
SESSION_SECRET=從_Replit_Secrets_複製

# Base URL (部署後更新為您的域名)
NEXT_PUBLIC_BASE_URL=https://你的專案.vercel.app
```

---

## ⚠️ 部署後必做（重要！）

### 1. 更新 LINE LIFF Endpoint URL

前往 https://developers.line.biz/ → 您的 LIFF App → 更新：
```
https://你的專案.vercel.app/checkin
```

### 2. 更新 LINE Login Callback URL

前往 LINE Developers Console → LINE Login Channel → 更新：
```
https://你的專案.vercel.app/api/auth/line-oauth/callback
```

### 3. 更新 NEXT_PUBLIC_BASE_URL

在 Vercel Dashboard → Environment Variables → 更新：
```
NEXT_PUBLIC_BASE_URL=https://你的專案.vercel.app
```

然後重新部署（Redeploy）。

---

## ✅ 測試清單

- [ ] 訪問首頁（瀏覽器顯示管理後台入口）
- [ ] 測試 `/admin/login`（LINE Login OAuth）
- [ ] 測試 `/checkin`（LIFF in LINE App）
- [ ] 測試權限系統（SuperAdmin/checkin_admin）

---

## 🆘 遇到問題？

### 「redirect_uri mismatch」
→ 檢查 LINE Callback URL 是否正確

### 「LIFF init failed」
→ 檢查 LIFF Endpoint URL 是否正確

### 「Build Error」
→ 檢查環境變數是否完整

---

**詳細說明請參閱：** `DEPLOYMENT_CHECKLIST.md`

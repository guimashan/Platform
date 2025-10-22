# 📱 LINE Bot Webhook 設定指南

## 🎯 目標
讓您的 LINE Bot 能夠接收並回覆用戶訊息

---

## 📋 前置準備

✅ 已有 LINE Developers 帳號  
✅ 已創建 Messaging API Channel  
✅ Webhook URL：`https://go.guimashan.org.tw/api/webhook`

---

## 🔧 設定步驟

### 1️⃣ 登入 LINE Developers Console

前往：https://developers.line.biz/console/

### 2️⃣ 選擇您的 Messaging API Channel

在 Providers 列表中找到您的 Channel

### 3️⃣ 前往 Messaging API 設定頁面

點擊左側選單：**Messaging API**

---

## ⚙️ Webhook 設定

### 步驟 A：設定 Webhook URL

1. 找到 **Webhook settings** 區塊
2. 點擊 **Edit** 按鈕
3. 輸入 Webhook URL：
   ```
   https://go.guimashan.org.tw/api/webhook
   ```
4. 點擊 **Update**

### 步驟 B：驗證 Webhook

1. 點擊 **Verify** 按鈕
2. 應該會看到 ✅ **Success** 訊息
3. 如果失敗，請檢查：
   - URL 是否正確
   - Vercel 環境變數是否已設定
   - `LINE_BOT_CHANNEL_SECRET` 是否正確

### 步驟 C：啟用 Webhook

1. 找到 **Use webhook** 開關
2. 將開關切換到 **Enabled** (綠色)

---

## 🔑 取得必要的環境變數

### Channel Secret
1. 在同一頁面找到 **Channel secret** 
2. 點擊 **Show** 查看
3. 複製並設定到 Vercel 環境變數：
   ```
   LINE_BOT_CHANNEL_SECRET=your_channel_secret_here
   ```

### Channel Access Token
1. 向下滾動找到 **Channel access token**
2. 點擊 **Issue** 按鈕（如果還沒有 token）
3. 複製 Long-lived access token
4. 設定到 Vercel 環境變數：
   ```
   LINE_BOT_ACCESS_TOKEN=your_access_token_here
   ```

### Channel ID
1. 回到頁面頂部的 **Basic settings** 頁籤
2. 複製 **Channel ID**
3. 設定到 Vercel 環境變數：
   ```
   LINE_BOT_CHANNEL_ID=your_channel_id_here
   ```

---

## 🧪 測試 Webhook

### 方法 1：使用 LINE Developers Console

1. 在 Messaging API 頁面
2. 找到 QR Code 或加入好友連結
3. 用手機掃描 QR Code 加 Bot 為好友
4. 發送訊息給 Bot
5. Bot 應該會回覆：「收到：[您的訊息]」

### 方法 2：使用 Webhook 測試功能

1. 在 Webhook settings 區塊
2. 點擊 **Test** 按鈕
3. 查看測試結果

---

## 🔍 驗證環境變數設定

訪問以下 URL 檢查 Bot 健康狀態：

```
https://go.guimashan.org.tw/api/ping-bot
```

**預期回應**：
```json
{
  "ok": true,
  "timestamp": "2025-10-22T...",
  "env": {
    "channelId": true,
    "channelSecret": true,
    "accessToken": true
  },
  "services": {
    "lineMessagingApi": true
  }
}
```

如果任何值是 `false`，表示對應的環境變數未設定或無效。

---

## ⚠️ 常見問題

### Q1: Verify 失敗
**原因**：
- Webhook URL 錯誤
- Channel Secret 未設定或錯誤
- 伺服器無法訪問

**解決**：
1. 確認 URL：`https://go.guimashan.org.tw/api/webhook`
2. 檢查 Vercel 環境變數
3. 確認最新代碼已部署

### Q2: Bot 不回覆訊息
**原因**：
- Webhook 未啟用
- Access Token 錯誤
- Reply API 權限問題

**解決**：
1. 確認 **Use webhook** 是 Enabled
2. 重新 Issue Access Token
3. 檢查 Bot 的 Messaging API 權限

### Q3: 收到 401 Unauthorized
**原因**：
- 簽章驗證失敗
- Channel Secret 不匹配

**解決**：
1. 確認 `LINE_BOT_CHANNEL_SECRET` 正確
2. 重新從 Console 複製 Channel Secret
3. 在 Vercel 重新設定環境變數後重新部署

---

## 📊 Webhook 工作原理

```
用戶發訊息
    ↓
LINE Platform 發送 POST 到您的 Webhook
    ↓
您的 API 驗證簽章 (使用 CHANNEL_SECRET)
    ↓
解析訊息內容
    ↓
呼叫 LINE Reply API (使用 ACCESS_TOKEN)
    ↓
用戶收到回覆
```

---

## 🔐 安全注意事項

1. ✅ **絕對不要**在代碼中硬編碼 Channel Secret 或 Access Token
2. ✅ **絕對不要**將環境變數提交到 Git
3. ✅ **務必**在 Vercel 環境變數中設定所有密鑰
4. ✅ **定期**更換 Access Token（建議每 6 個月）

---

## 📝 設定檢查清單

- [ ] Webhook URL 已設定：`https://go.guimashan.org.tw/api/webhook`
- [ ] Webhook Verify 成功 ✅
- [ ] Use webhook 已啟用（綠色）
- [ ] Channel Secret 已設定到 Vercel
- [ ] Access Token 已設定到 Vercel
- [ ] Channel ID 已設定到 Vercel
- [ ] `/api/ping-bot` 返回全部 `true`
- [ ] 已用手機測試發送訊息
- [ ] Bot 成功回覆訊息

---

## 🎉 完成！

當所有檢查項目都完成後，您的 LINE Bot Webhook 就設定完成了！

現在可以：
- ✅ 接收用戶訊息
- ✅ 自動回覆訊息
- ✅ 擴展更多功能（關鍵字回覆、Rich Menu 等）

---

## 🔗 相關連結

- **LINE Developers Console**：https://developers.line.biz/console/
- **Messaging API 文件**：https://developers.line.biz/en/docs/messaging-api/
- **Webhook 參考**：https://developers.line.biz/en/docs/messaging-api/receiving-messages/

---

**建立日期**：2025-10-22  
**適用版本**：Next.js 14 + Vercel 部署

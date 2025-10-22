# Vercel 部署指南

## 概述

本專案提供自動部署到 Vercel 的 API，支援：
- ✅ 環境變數自動同步
- ✅ 一鍵觸發部署
- ✅ 查詢部署狀態
- ✅ 取得正式域名

## 前置設定

### 1. 必要的 Replit Secrets

請確保以下 Secrets 已設定：

| Secret 名稱 | 說明 | 如何取得 |
|------------|------|---------|
| `VERCEL_ADMIN_API_KEY` | Vercel API Token | [Vercel Account Tokens](https://vercel.com/account/tokens) |
| `VERCEL_PROJECT_ID` | 專案 ID | 專案設定 → General → Project ID |
| `VERCEL_ORG_ID` | 組織/團隊 ID | 專案設定 → General → Team ID |
| `VERCEL_DEPLOY_HOOK_URL` | Deploy Hook URL | 見下方步驟 |

### 2. 建立 Vercel Deploy Hook

Deploy Hook 是觸發 Vercel 部署最簡單的方式：

1. 前往您的 Vercel 專案設定
   ```
   https://vercel.com/您的團隊名稱/專案名稱/settings/git
   ```

2. 找到 **Deploy Hooks** 區塊

3. 點擊 **Create Hook** 按鈕

4. 設定：
   - **Hook Name**: `Replit Auto Deploy`（或任何您喜歡的名稱）
   - **Git Branch**: `main`（或您的主分支名稱）

5. 點擊 **Create Hook**

6. 複製生成的 URL（格式類似：`https://api.vercel.com/v1/integrations/deploy/prj_xxx/xxx`）

7. 在 Replit Secrets 中加入：
   - Key: `VERCEL_DEPLOY_HOOK_URL`
   - Value: 剛複製的 URL

## API 端點

**⚠️ 認證要求：** 除了查詢域名和狀態的 GET 端點外，所有 POST 端點都需要認證。請在請求 header 中加入：

```
Authorization: Bearer YOUR_VERCEL_ADMIN_API_KEY
```

### 1. 查詢 Vercel 域名

取得您的正式域名（用於設定 LINE Webhook）：

```bash
GET /api/deploy/domains
```

**無需認證**

**回應範例：**
```json
{
  "ok": true,
  "domains": [
    "platform-xxx.vercel.app",
    "go.guimashan.org.tw"
  ]
}
```

### 2. 同步環境變數

將 Replit Secrets 同步到 Vercel：

```bash
POST /api/deploy/sync-env
Content-Type: application/json
Authorization: Bearer YOUR_VERCEL_ADMIN_API_KEY

{
  "KEY1": "value1",
  "KEY2": "value2"
}
```

**需要認證**

**回應範例：**
```json
{
  "ok": true,
  "message": "環境變數同步成功",
  "created": 1,
  "updated": 1,
  "total": 2
}
```

### 3. 觸發部署

觸發 Vercel 重新部署：

```bash
POST /api/deploy/trigger
Authorization: Bearer YOUR_VERCEL_ADMIN_API_KEY
```

**需要認證**

**回應範例：**
```json
{
  "ok": true,
  "job": {
    "id": "ZBvFsW38HZLDUurq72vE",
    "state": "PENDING",
    "createdAt": 1761143564220
  },
  "message": "部署已觸發，請至 Vercel Dashboard 查看進度"
}
```

### 4. 查詢部署狀態

查詢最新的部署狀態：

```bash
GET /api/deploy/status
```

**無需認證**

**回應範例：**
```json
{
  "ok": true,
  "deployment": {
    "uid": "dpl_xxx",
    "state": "READY",
    "url": "platform-xxx.vercel.app",
    "createdAt": 1234567890
  }
}
```

### 5. 一鍵完整部署

自動同步所有環境變數並觸發部署：

```bash
POST /api/deploy/full
Authorization: Bearer YOUR_VERCEL_ADMIN_API_KEY
```

**需要認證**

此 API 會自動同步以下環境變數：
- Firebase 相關變數
- LINE Bot 相關變數
- Session Secret

**回應範例：**
```json
{
  "ok": true,
  "message": "環境變數同步完成，部署已觸發",
  "sync": {
    "created": 5,
    "updated": 7,
    "total": 12
  },
  "deployment": {
    "job": {
      "id": "ZBvFsW38HZLDUurq72vE",
      "state": "PENDING",
      "createdAt": 1761143564220
    },
    "message": "部署已觸發，請至 Vercel Dashboard 查看進度"
  }
}
```

## 使用流程

### 初次設定

1. **設定所有必要的 Secrets**（見上方表格）

2. **同步環境變數到 Vercel**
   ```bash
   curl -X POST https://您的-replit-url.replit.dev/api/deploy/full \
     -H "Authorization: Bearer YOUR_VERCEL_ADMIN_API_KEY"
   ```

3. **等待部署完成**
   - 前往 Vercel Dashboard 查看部署進度
   - 或使用 `/api/deploy/status` API 查詢

4. **取得正式域名**
   ```bash
   curl https://您的-replit-url.replit.dev/api/deploy/domains
   ```

5. **設定 LINE Webhook URL**
   - 使用正式域名設定 LINE Bot Webhook
   - 格式：`https://您的正式域名/api/webhook`
   - 例如：`https://go.guimashan.org.tw/api/webhook`

### 日常更新流程

當您在 Replit 上更新程式碼後：

1. **確認更新已推送到 Git**（如果使用 Git 同步）

2. **觸發部署**
   ```bash
   curl -X POST https://您的-replit-url.replit.dev/api/deploy/trigger \
     -H "Authorization: Bearer YOUR_VERCEL_ADMIN_API_KEY"
   ```

3. **查看部署狀態**
   ```bash
   curl https://您的-replit-url.replit.dev/api/deploy/status
   ```

## 正式 Webhook URL

部署到 Vercel 後，您的正式 LINE Webhook URL 為：

```
https://您的正式域名/api/webhook
```

範例：
- `https://platform-xxx.vercel.app/api/webhook`
- `https://go.guimashan.org.tw/api/webhook`

請在 LINE Developers Console 設定此 URL。

## 疑難排解

### Deploy Hook 錯誤

**錯誤訊息：**
```
缺少 VERCEL_DEPLOY_HOOK_URL 環境變數
```

**解決方法：**
1. 確認已在 Vercel Dashboard 建立 Deploy Hook
2. 確認已將 Hook URL 加入 Replit Secrets
3. 確認 Secret 名稱正確：`VERCEL_DEPLOY_HOOK_URL`

### 環境變數未同步

**可能原因：**
- Vercel API Token 權限不足
- Project ID 或 Org ID 錯誤

**解決方法：**
1. 重新產生 Vercel API Token 並確保有完整權限
2. 確認 Project ID 和 Org ID 正確

### 部署失敗

**檢查步驟：**
1. 前往 Vercel Dashboard 查看詳細錯誤訊息
2. 確認所有必要的環境變數都已設定
3. 確認專案的 Git 設定正確

## 安全注意事項

⚠️ **重要提醒：**

1. **API 認證保護**
   - 所有 POST 端點都需要 `Authorization: Bearer` 認證
   - 使用 `VERCEL_ADMIN_API_KEY` 作為 Bearer token
   - 此 token 擁有完整的部署管理權限，切勿洩漏

2. **Deploy Hook URL 是敏感資訊**
   - 任何人擁有此 URL 都能觸發部署
   - 不要公開分享此 URL
   - 視為 Secret 妥善保管

3. **API Token 安全**
   - 定期輪換 Vercel API Token
   - 只授予必要的權限
   - 不要在程式碼中硬編碼

4. **環境變數管理**
   - 定期檢查同步的環境變數
   - 移除不再使用的變數
   - 確保敏感資訊正確加密

## 相關連結

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Deploy Hooks 文件](https://vercel.com/docs/deploy-hooks)
- [Vercel API 文件](https://vercel.com/docs/rest-api)
- [LINE Developers Console](https://developers.line.biz/console/)

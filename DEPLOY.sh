#!/bin/bash

# PowerUser 功能部署腳本
# 執行此腳本將提交代碼並推送到 GitHub，觸發 Vercel 自動部署

echo "🚀 開始部署 PowerUser 功能..."
echo ""

# 檢查 Git 狀態
echo "📋 檢查變更的檔案..."
git status --short
echo ""

# 添加所有變更
echo "➕ 添加變更到 Git..."
git add .
echo ""

# 提交變更
echo "💾 提交變更..."
git commit -m "feat: 新增 PowerUser 角色支援

✅ 四層權限系統
- user: 一般使用者（只能使用 LIFF 簽到）
- poweruser: 進階使用者（可查看管理後台，不能修改設定）
- admin: 管理員（可查看和修改所有設定）
- superadmin: 超級管理員（跨系統管理）

✅ 後端 API 權限控制
- /api/auth/permissions: 新增返回 checkin_role, schedule_role, service_role
- /api/checkin/stats: poweruser 可查看
- /api/checkin/records: poweruser 可查看
- 修改類 API: 需要 admin 權限

✅ 前端 UI 權限控制
- /admin: poweruser 可看到簽到系統卡片
- /checkin/manage: poweruser 只看到「簽到記錄」卡片
- /checkin/manage: admin 看到「人員管理」、「巡邏點管理」、「簽到記錄」三個卡片

✅ 安全性審查
- 通過 2 次 Architect 代碼審查
- 前後端權限完全一致
- UI 層面隱藏 admin 功能
- API 層面阻擋未授權請求

✅ 向後相容
- 舊架構 roles.checkin_admin 仍然有效

✅ 測試文檔
- tests/POWERUSER_TEST_PLAN.md（11 個測試案例）
- tests/POWERUSER_TEST_SUMMARY.md（權限矩陣）
- tests/MANUAL_TEST_GUIDE.md（手動測試指南）
- DEPLOYMENT_GUIDE.md（部署指南）

變更的檔案:
- src/lib/auth-helpers.ts
- src/app/api/auth/permissions/route.ts
- src/app/api/checkin/stats/route.ts
- src/app/api/checkin/records/route.ts
- src/app/admin/page.tsx
- src/app/checkin/manage/page.tsx
- tests/*
- replit.md
"

echo ""

# 推送到 GitHub
echo "⬆️  推送到 GitHub..."
git push origin main

echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 接下來："
echo "1. 前往 Vercel Dashboard 查看部署狀態"
echo "2. 等待部署完成（約 2-3 分鐘）"
echo "3. 訪問 https://go.guimashan.org.tw/ 驗證"
echo ""
echo "🧪 測試前準備："
echo "1. 在 Firebase Console 建立測試帳號（參考 DEPLOYMENT_GUIDE.md）"
echo "2. 使用測試帳號登入驗證功能"
echo ""

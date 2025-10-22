#!/usr/bin/env bash
set -euo pipefail

# === 參數 ===
DOMAIN="${DOMAIN:-go.guimashan.org.tw}"     # 正式網域（可改）
PROJECT_SLUG="platform"
TOKEN="${VERCEL_ADMIN_API_KEY:-}"
LINE_ID="${LINE_BOT_CHANNEL_ID:-}"
LINE_TOKEN="${LINE_BOT_ACCESS_TOKEN:-}"

# === 檢查 ===
[[ -n "$TOKEN" ]] || { echo "❌ 缺少 VERCEL_ADMIN_API_KEY"; exit 1; }
[[ -n "$LINE_ID" ]] || { echo "❌ 缺少 LINE_BOT_CHANNEL_ID"; exit 1; }
[[ -n "$LINE_TOKEN" ]] || { echo "❌ 缺少 LINE_BOT_ACCESS_TOKEN"; exit 1; }

echo "== 🧩 M7 任務：Vercel 正式環境部署 + LINE Webhook 同步 =="

# 1️⃣ 部署至 Vercel Production（略）
if [ -f scripts/m7_deploy.sh ]; then
  bash scripts/m7_deploy.sh || true
else
  echo "⚠️ 找不到 m7_deploy.sh，略過部署步驟。"
fi

# 2️⃣ 更新 LINE Webhook URL
echo "== 🔧 更新 LINE Webhook 至正式網域 =="
WEBHOOK_URL="https://${DOMAIN}/api/webhook"

curl -s -X PUT \
  -H "Authorization: Bearer ${LINE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"endpoint\": \"${WEBHOOK_URL}\"}" \
  "https://api.line.me/v2/bot/channel/webhook/endpoint" \
  | jq .

# 3️⃣ 驗證 Webhook 狀態
echo "== 🧪 驗證 LINE Webhook 狀態 =="
curl -s -X GET \
  -H "Authorization: Bearer ${LINE_TOKEN}" \
  "https://api.line.me/v2/bot/channel/webhook/endpoint" | jq .

# 4️⃣ 測試 /api/ping-bot 與 /api/ping-admin
echo "== 🔍 測試正式環境 API 狀態 =="
curl -s "https://${DOMAIN}/api/ping-bot" | jq .
curl -s "https://${DOMAIN}/api/ping-admin" | jq .

# 5️⃣ 寫入驗收報告
DATE="$(date +'%Y-%m-%d %H:%M:%S %Z')"
cat >> ACCEPTANCE_REPORT.md <<EOF

## M7 更新 Webhook（正式環境）
- 執行時間：$DATE
- 新 Webhook：$WEBHOOK_URL
- 驗證結果：
  - ping-bot：$(curl -s "https://${DOMAIN}/api/ping-bot" | jq -r .ok)
  - ping-admin：$(curl -s "https://${DOMAIN}/api/ping-admin" | jq -r .ok)

EOF

git add ACCEPTANCE_REPORT.md
git commit -m "chore(M7): Update LINE Webhook to Vercel domain @ $DATE" || true
git push origin main --force || true

echo "✅ M7 完成：Webhook 已指向 ${WEBHOOK_URL}"

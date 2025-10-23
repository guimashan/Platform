#!/usr/bin/env bash
set -euo pipefail

# ====== 基本設定 ======
DOMAIN="${NEXT_PUBLIC_BASE_URL:-}"
DEPLOY_HOOK="${VERCEL_DEPLOY_HOOK_URL:-}"

PINGS=(
  "/api/ping-bot"
  "/api/ping-admin"
  "/api/webhook"     # 會回 Invalid signature 代表端點存在
)

# ====== 前置檢查 ======
echo "== M7 Final Clean | 環境檢查 =="
[[ -n "$DOMAIN" ]]      || { echo "❌ 缺少 NEXT_PUBLIC_BASE_URL"; exit 1; }
echo "✅ BASE_URL：$DOMAIN"

if [[ -n "$DEPLOY_HOOK" ]]; then
  echo "✅ 有部署 Hook（可用來觸發正式部署）"
else
  echo "⚠️ 未提供 VERCEL_DEPLOY_HOOK_URL（將跳過『部署觸發』）"
fi
echo

# ====== 觸發 Vercel 正式部署（可選）======
if [[ -n "$DEPLOY_HOOK" ]]; then
  echo "== 觸發 Vercel 正式部署 =="
  # 觸發一次部署
  curl -fsSL -X POST "$DEPLOY_HOOK" >/dev/null && echo "🚀 已送出部署請求"
  # 等待冷啟/切換
  echo "⏳ 等候 20 秒以利部署切換…"
  sleep 20
  echo
fi

# ====== 服務健康檢查 ======
echo "== 健康檢查 =="
PASS=1

for path in "${PINGS[@]}"; do
  url="${DOMAIN%/}${path}"
  echo "-- 檢查：$url"
  status="$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)"

  case "$path" in
    "/api/webhook")
      # 預期 400 或 401（Invalid signature / no body）都代表端點存在
      if [[ "$status" == "200" || "$status" == "204" || "$status" == "400" || "$status" == "401" ]]; then
        echo "   ✅ 存活（HTTP $status）"
      else
        echo "   ❌ 失敗（HTTP $status）"; PASS=0
      fi
      ;;
    *)
      # /api/ping-* 預期 200
      if [[ "$status" == "200" ]]; then
        echo "   ✅ 存活（HTTP 200）"
      else
        echo "   ❌ 失敗（HTTP $status）"; PASS=0
      fi
      ;;
  esac
done
echo

# ====== 舊 OAuth 路由確認（檔案不存在即可）======
echo "== 舊 OAuth 路由清理確認 =="
LEGACY_FILES=(
  "src/app/api/login/route.ts"
  "src/app/api/checkin/route.ts"
  "src/app/api/checkin/manage/route.ts"
)
LEGACY_OK=1
for f in "${LEGACY_FILES[@]}"; do
  if [[ -e "$f" ]]; then
    echo "   ❌ 尚存在：$f"; LEGACY_OK=0
  else
    echo "   ✅ 已移除：$f"
  fi
done
echo

# ====== 生成遷移報告 ======
echo "== 生成 COMPLETE_MIGRATION_REPORT.md =="
DATE="$(date '+%Y-%m-%d %H:%M:%S %Z')"
{
  echo "# 完整遷移驗收報告（M7 Final Clean）"
  echo "- 生成時間：$DATE"
  echo "- 正式網域：$DOMAIN"
  echo "- 觸發部署：$([[ -n "$DEPLOY_HOOK" ]] && echo 已觸發 || echo 略過)"
  echo
  echo "## 健康檢查結果"
  for path in "${PINGS[@]}"; do
    url="${DOMAIN%/}${path}"
    status="$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)"
    echo "- \`$url\` → HTTP $status"
  done
  echo
  echo "## 舊 OAuth 路由檔案"
  for f in "${LEGACY_FILES[@]}"; do
    if [[ -e "$f" ]]; then
      echo "- ❌ 尚存在：$f"
    else
      echo "- ✅ 已移除：$f"
    fi
  done
  echo
  if [[ "$PASS" == "1" && "$LEGACY_OK" == "1" ]]; then
    echo "### 結論：✅ 驗收通過（已上線 LIFF 架構、端點存活、舊路由清乾淨）"
  else
    echo "### 結論：❌ 驗收未通過（請依上面失敗項修正後重跑）"
  fi
} > COMPLETE_MIGRATION_REPORT.md

echo "📄 已輸出報告：COMPLETE_MIGRATION_REPORT.md"
echo

# ====== 可選：提交並推送到 GitHub（若有設定遠端）======
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add COMPLETE_MIGRATION_REPORT.md || true
  git commit -m "M7: Final clean report for LIFF migration" >/dev/null 2>&1 || true
  if git config --get remote.origin.url >/dev/null; then
    git push origin main || true
    echo "⬆️ 已嘗試推送報告到 GitHub（若無權限會自動略過）"
  fi
fi

# ====== 總結 ======
if [[ "$PASS" == "1" && "$LEGACY_OK" == "1" ]]; then
  echo "🎉 M7 Final Clean 完成：系統健康、路由整潔。"
  exit 0
else
  echo "⚠️ M7 Final Clean 尚有未通過項目，請修正後重跑。"
  exit 1
fi

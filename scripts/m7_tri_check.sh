#!/usr/bin/env bash
set -euo pipefail

C_G="\033[32m"; C_Y="\033[33m"; C_R="\033[31m"; C_C="\033[36m"; C_N="\033[0m"
hr(){ printf "${C_C}%s${C_N}\n" "────────────────────────────────────────"; }

# === 0) 目標網域 & 路由期望 ===
DOMAIN="${NEXT_PUBLIC_BASE_URL:-https://go.guimashan.org.tw}"
[[ "$DOMAIN" != http* ]] && DOMAIN="https://$DOMAIN"
EXPECT_404=( "/api/login" )                 # 舊 OAuth 路由，應該 404
EXPECT_OK=( "/api/ping-bot" "/api/ping-admin" "/api/webhook" )  # 應該存在的端點

echo -e "${C_C}三端狀態對比＆健康檢查${C_N}"
echo "Domain: $DOMAIN"
hr

# === 1) R 社（Replit／工作區）檢查 ===
echo -e "${C_Y}[R社] Replit 工作區檢查${C_N}"
echo -n "• git 工作樹狀態： "
if git status --porcelain | grep -q .; then
  echo -e "${C_Y}有未提交變更${C_N}"
  git status --porcelain
else
  echo -e "${C_G}乾淨（no changes）${C_N}"
fi
echo -e "• 最近一次提交： $(git log -1 --oneline || echo '無')"
echo -e "• 目前遠端："
git remote -v || true
hr

# === 2) G 社（GitHub）同步概況（本地對遠端） ===
echo -e "${C_Y}[G社] GitHub 同步概況${C_N}"
# 取遠端最新提交 id（只抓一筆，不依賴 jq）
UPSTREAM_REF="$(git ls-remote --heads 2>/dev/null | awk '/refs\/heads\/main/{print $1; exit}' || true)"
LOCAL_REF="$(git rev-parse HEAD 2>/dev/null || true)"
echo "• 遠端 main： ${UPSTREAM_REF:-(未知)}"
echo "• 本地 HEAD： ${LOCAL_REF:-(未知)}"
if [[ -n "${UPSTREAM_REF:-}" && -n "${LOCAL_REF:-}" && "$UPSTREAM_REF" != "$LOCAL_REF" ]]; then
  echo -e "• 狀態：${C_Y}本地與遠端不同步${C_N}"
else
  echo -e "• 狀態：${C_G}本地與遠端一致${C_N}"
fi
hr

# === 3) V 社（Vercel）線上端點健康檢查 ===
echo -e "${C_Y}[V社] 線上 API 端點健康檢查（$DOMAIN）${C_N}"

curl_code(){
  local url="$1"
  curl -sS -o /dev/null -w "%{http_code}" "$url" || echo "000"
}

check_expect_ok(){
  local path="$1"; local code; code="$(curl_code "$DOMAIN$path")"
  if [[ "$code" == "200" || "$code" == "400" || "$code" == "401" ]]; then
    # /api/webhook 回 400(Invalid signature) 也代表端點存在
    printf "  %s%-18s%s -> %sOK(%s)%s\n" "$C_G" "$path" "$C_N" "$C_G" "$code" "$C_N"
  else
    printf "  %s%-18s%s -> %sFAIL(%s)%s\n" "$C_R" "$path" "$C_N" "$C_R" "$code" "$C_N"
  fi
}

check_expect_404(){
  local path="$1"; local code; code="$(curl_code "$DOMAIN$path")"
  if [[ "$code" == "404" || "$code" == "405" ]]; then
    printf "  %s%-18s%s -> %s已下線(預期 %s)%s\n" "$C_G" "$path" "$C_N" "$C_G" "$code" "$C_N"
  else
    printf "  %s%-18s%s -> %s仍存在(實得 %s)%s\n" "$C_R" "$path" "$C_N" "$C_R" "$code" "$C_N"
  fi
}

echo "• 應存在端點（OK/400/401 視為健康）："
for p in "${EXPECT_OK[@]}"; do check_expect_ok "$p"; done

echo "• 應下線端點（404/405 視為健康）："
for p in "${EXPECT_404[@]}"; do check_expect_404 "$p"; done
hr

# === 4) Vercel 部署狀態（可選，無 jq 簡易解析） ===
if [[ -n "${VERCEL_ADMIN_API_KEY:-}" && -n "${VERCEL_PROJECT_ID:-}" && -n "${VERCEL_ORG_ID:-}" ]]; then
  echo -e "${C_Y}[V社] 最近部署狀態（簡易）${C_N}"
  RESP="$(curl -sS -H "Authorization: Bearer ${VERCEL_ADMIN_API_KEY}" \
    "https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_ORG_ID}&limit=1")" || RESP=""
  STATE="$(printf "%s" "$RESP" | tr -d '\n' | sed 's/\\\//\//g' | grep -o '"state":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')"
  URL="$(printf "%s" "$RESP" | tr -d '\n' | sed 's/\\\//\//g' | grep -o '"url":"[^"]*"' | head -1 | cut -d':' -f2- | tr -d '"')"
  echo "• state: ${STATE:-unknown}"
  echo "• url:   ${URL:-unknown}"
else
  echo -e "${C_Y}[V社] 略過部署狀態：未提供 VERCEL_ADMIN_API_KEY / VERCEL_PROJECT_ID / VERCEL_ORG_ID${C_N}"
fi
hr

echo -e "${C_G}✅ 檢查完成。${C_N}"
echo "建議後續："
echo "  1) 上面有 FAIL 的端點：檢查路由或重新部署"
echo "  2) 若本地與遠端不同步：請 git add/commit/push 再讓 Vercel 自動部署"

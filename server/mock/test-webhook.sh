#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:5173}"  # 改成你的 dev 網址（例如 https://xxx.replit.dev）

echo "POST $BASE/api/webhook with mock body"
curl -sS -X POST "$BASE/api/webhook" \
  -H "Content-Type: application/json" \
  --data-binary "@$(dirname "$0")/webhook-body.json"
echo

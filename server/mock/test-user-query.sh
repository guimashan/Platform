#!/bin/bash
# 測試查詢使用者資料

echo "🔍 測試 Firestore 使用者查詢"
echo "=============================="
echo ""
echo "請輸入您的 LINE User ID（例如：U1234567890abcdef）："
read -r LINE_USER_ID

if [ -z "$LINE_USER_ID" ]; then
  echo "❌ 錯誤：未輸入 LINE User ID"
  exit 1
fi

echo ""
echo "查詢中..."
curl -sS "http://localhost:5175/api/admin/users?uid=$LINE_USER_ID" | jq .
echo ""
echo "✅ 查詢完成"

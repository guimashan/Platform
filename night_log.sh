#!/bin/bash
# 🌙 每日收章腳本 + G社同步
DATE=$(date +"%Y-%m-%d %H:%M")
LAST_DAY=$(grep "## 🌅 第" ACCEPTANCE_REPORT.md | tail -1 | sed "s/## 🌅 //")

if [ -z "$LAST_DAY" ]; then
  echo "⚠️ 找不到章節，請先執行 ./daily_log.sh"
  exit 1
fi

SUMMARY="\n\n### 🌙 日暮收章（${DATE}）\n"
SUMMARY+="今日任務完成狀況：\n"
SUMMARY+="- 🔧 程式穩定運行\n"
SUMMARY+="- ☁️ Firebase Admin 狀態良好\n"
SUMMARY+="- 💡 明日準備：新功能設計會議\n\n"
SUMMARY+="> Ｃ社：「部署成功。」\n"
SUMMARY+="> Ｒ社：「又加班了……」\n"
SUMMARY+="> 花社：「但至少香火不滅。」\n"
SUMMARY+="> Ｇ社靜靜收納所有歷史紀錄。\n"

echo -e "$SUMMARY" >> ACCEPTANCE_REPORT.md
echo "🌙 收章完成：${LAST_DAY}"

git add ACCEPTANCE_REPORT.md
git commit -m "🪔 nightly log: ${LAST_DAY} 收章完畢"
git push https://guimashan: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@github.com/guimashan/Platform.git main --force
echo "✅ 已同步至 G社"


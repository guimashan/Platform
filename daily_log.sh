#!/bin/bash
# 🌅 每日開章腳本
DATE=$(date +"%Y-%m-%d")
COUNT=$(grep -c "## 🌅 第" ACCEPTANCE_REPORT.md 2>/dev/null || echo 0)
DAY=$((COUNT+1))

ENTRY="\n\n## 🌅 第${DAY}天（新章啟動）\n\n### 🎙 敘事開場\n花社：「又是新的一天，神明請加持我們的部署。」\n\n### 📜 今日任務\n- [ ] 尚未開始\n\n### 📈 今日進度\n| 模組 | 進度 | 狀態 |\n|------|------|------|\n| 新章節 | 0% | 準備中 |\n\n> Ｃ社（軍師）：「今日氣象晴朗，適合開發。」\n> Ｒ社（工程師）：「又是加班的預感……」\n"

echo -e "$ENTRY" >> ACCEPTANCE_REPORT.md
echo "✅ 新章節已建立：第 ${DAY} 天（$DATE）"


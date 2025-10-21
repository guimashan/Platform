# 龜馬山 goLine 平台｜驗收報告（R社 → G社 同步）

- 報告日期：2025-10-21
- 驗收範圍：M1（UI / 路由 / 樣式）＋ M2（Admin 檢測 / API）
- R社 Replit 專案：https://replit.com/@guimashan/Gui-Ma-Shan-Zheng-He-Fu-Wu-Ping-Tai
- G社 GitHub 專案：https://github.com/guimashan/Platform
- 驗收結論：⚙️ 驗收中（等待 G社 對比同步）

---

## A. 重要檔案差異摘要（R社 vs G社）
> 來源：`git diff --name-status origin/main..HEAD`

| 變更 | 檔案 |
|---|---|
| A | client/src/components/ui/Navbar.tsx |
| A | client/src/components/ui/Footer.tsx |
| A | client/src/components/ui/ThemeToggle.tsx |
| A | client/src/components/ui/StateCards.tsx |
| M | client/src/App.tsx |
| A | client/src/pages/home.tsx |
| A | client/src/pages/login.tsx |
| A | client/src/pages/checkin.tsx |
| A | client/src/pages/service.tsx |
| A | client/src/pages/schedule.tsx |
| M | tailwind.config.ts |
| M | postcss.config.js |
| M | client/src/index.css |
| M | server/firebaseAdmin.ts |
| M | server/routes.ts |
| M | server/index.ts |

> A = 新增，M = 修改，D = 刪除

---

## B. M1 驗收（UI / 路由 / 樣式）
- [x] 已安裝 `tailwindcss`、`postcss`、`autoprefixer`、`daisyui`
- [x] `tailwind.config.ts`：content 指向 `client/**/*.{html,js,ts,jsx,tsx}`
- [x] `tailwind.config.ts`：plugins 已加入 daisyui；themes=["light","dark"]
- [x] `client/src/index.css`：有 @tailwind base/components/utilities
- [x] 共用元件存在：
  - [x] Navbar
  - [x] Footer
  - [x] ThemeToggle
  - [x] StateCards
- [x] 頁面存在：Home / Login / Checkin / Service / Schedule
- [x] App.tsx 使用 react-router-dom 串接元件

---

## C. M2 驗收（Admin 檢測 / API）
- [x] `.env` 含 `FIREBASE_SERVICE_ACCOUNT_JSON`（未上傳 G社）
- [x] `server/firebaseAdmin.ts` 初始化成功
- [x] `server/routes.ts`：GET `/api/ping-admin` 回傳 { ok:true, ... }
- [x] `server/index.ts` 掛載 `mountRoutes(app)`
- [ ] Replit Dev URL 驗證中

---

## D. 待辦與風險
- [ ] 確認 `.gitignore` 屏蔽 `.env`、憑證檔案
- [ ] 驗證 Replit → G社 push 流程
- [ ] 第二階段（使用者登入、簽到模組）待規劃

---

## E. 版本資訊
- Node.js：v18.x（Replit）
- Framework：Vite + React + TypeScript
- Firebase Admin：v12+
- 部署平台：Replit + GitHub + Vercel
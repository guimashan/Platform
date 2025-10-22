# 龜馬山 goLine 平台｜開發日誌

> 一段人與神、機器與香火共修的開發故事。

---

## 🌕 第一階段：基礎工程
- M1: 初始化專案與前端 UI  
- M2: Firebase Admin 與伺服端整合  
- M3: LINE 登入導向系統  
- M4: 平台整合與部署

---

## 📘 第二階段：奉香簽到系統
> 敬香一柱，心誠則靈。

---

## 📗 第三階段：神服服務
> 每一件神服，皆為護法之衣。

---

## 📙 第四階段：排班系統
> 為神明服務的時間，也是一種修行。

---

## 📒 每日開發日誌
（待自動生成 🌅 與 🌙 章節）


## 🌅 第天（新章啟動）

### 🎙 敘事開場
花社：「又是新的一天，神明請加持我們的部署。」

### 📜 今日任務
- [ ] 尚未開始

### 📈 今日進度
| 模組 | 進度 | 狀態 |
|------|------|------|
| 新章節 | 0% | 準備中 |

> Ｃ社（軍師）：「今日氣象晴朗，適合開發。」
> Ｒ社（工程師）：「又是加班的預感……」



### 🌙 日暮收章（2025-10-22 02:26）
今日任務完成狀況：
- 🔧 程式穩定運行
- ☁️ Firebase Admin 狀態良好
- 💡 明日準備：新功能設計會議

> Ｃ社：「部署成功。」
> Ｒ社：「又加班了……」
> 花社：「但至少香火不滅。」
> Ｇ社靜靜收納所有歷史紀錄。

- 2025-10-22 M3：統一 LINE_LOGIN/LIFF/Messaging API Secrets；程式全面改用新命名

## M7 更新 Webhook（正式環境）
- 執行時間：2025-10-22 13:54:30 UTC
- 新 Webhook：https://go.guimashan.org.tw/api/webhook
- 回應狀態：
  - ping-bot：<!DOCTYPE html><html lang="zh-Hant"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack-e17383529fe6c8b6.js"/><script src="/_next/static/chunks/fd9d1056-9f91b5e418130764.js" async=""></script><script src="/_next/static/chunks/117-b06ad745578f0d64.js" async=""></script><script src="/_next/static/chunks/main-app-2dcde4753ea0d175.js" async=""></script><meta name="robots" content="noindex"/><title>404: This page could not be found.</title><title>龜馬山 goLine 平台</title><meta name="description" content="龜馬山平台（LINE 登入 / 打卡 / 服務 / 排班）"/><script src="/_next/static/chunks/polyfills-42372ed130431b0a.js" noModule=""></script></head><body style="margin:0;font-family:system-ui, -apple-system, Segoe UI, Roboto"><div style="font-family:system-ui,&quot;Segoe UI&quot;,Roboto,Helvetica,Arial,sans-serif,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;;height:100vh;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center"><div><style>body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}</style><h1 class="next-error-h1" style="display:inline-block;margin:0 20px 0 0;padding:0 23px 0 0;font-size:24px;font-weight:500;vertical-align:top;line-height:49px">404</h1><div style="display:inline-block"><h2 style="font-size:14px;font-weight:400;line-height:49px;margin:0">This page could not be found.</h2></div></div></div><script src="/_next/static/chunks/webpack-e17383529fe6c8b6.js" async=""></script><script>(self.__next_f=self.__next_f||[]).push([0]);self.__next_f.push([2,null])</script><script>self.__next_f.push([1,"1:I[2846,[],\"\"]\n3:I[4707,[],\"\"]\n4:I[6423,[],\"\"]\na:I[1060,[],\"\"]\n5:{\"fontFamily\":\"system-ui,\\\"Segoe UI\\\",Roboto,Helvetica,Arial,sans-serif,\\\"Apple Color Emoji\\\",\\\"Segoe UI Emoji\\\"\",\"height\":\"100vh\",\"textAlign\":\"center\",\"display\":\"flex\",\"flexDirection\":\"column\",\"alignItems\":\"center\",\"justifyContent\":\"center\"}\n6:{\"display\":\"inline-block\",\"margin\":\"0 20px 0 0\",\"padding\":\"0 23px 0 0\",\"fontSize\":24,\"fontWeight\":500,\"verticalAlign\":\"top\",\"lineHeight\":\"49px\"}\n7:{\"display\":\"inline-block\"}\n8:{\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":\"49px\",\"margin\":0}\nb:[]\n"])</script><script>self.__next_f.push([1,"0:[\"$\",\"$L1\",null,{\"buildId\":\"wonLN-VHs4e6ITrNqwLyT\",\"assetPrefix\":\"\",\"urlParts\":[\"\",\"_not-found\"],\"initialTree\":[\"\",{\"children\":[\"/_not-found\",{\"children\":[\"__PAGE__\",{}]}]},\"$undefined\",\"$undefined\",true],\"initialSeedData\":[\"\",{\"children\":[\"/_not-found\",{\"children\":[\"__PAGE__\",{},[[\"$L2\",[[\"$\",\"title\",null,{\"children\":\"404: This page could not be found.\"}],[\"$\",\"div\",null,{\"style\":{\"fontFamily\":\"system-ui,\\\"Segoe UI\\\",Roboto,Helvetica,Arial,sans-serif,\\\"Apple Color Emoji\\\",\\\"Segoe UI Emoji\\\"\",\"height\":\"100vh\",\"textAlign\":\"center\",\"display\":\"flex\",\"flexDirection\":\"column\",\"alignItems\":\"center\",\"justifyContent\":\"center\"},\"children\":[\"$\",\"div\",null,{\"children\":[[\"$\",\"style\",null,{\"dangerouslySetInnerHTML\":{\"__html\":\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\"}}],[\"$\",\"h1\",null,{\"className\":\"next-error-h1\",\"style\":{\"display\":\"inline-block\",\"margin\":\"0 20px 0 0\",\"padding\":\"0 23px 0 0\",\"fontSize\":24,\"fontWeight\":500,\"verticalAlign\":\"top\",\"lineHeight\":\"49px\"},\"children\":\"404\"}],[\"$\",\"div\",null,{\"style\":{\"display\":\"inline-block\"},\"children\":[\"$\",\"h2\",null,{\"style\":{\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":\"49px\",\"margin\":0},\"children\":\"This page could not be found.\"}]}]]}]}]],null],null],null]},[null,[\"$\",\"$L3\",null,{\"parallelRouterKey\":\"children\",\"segmentPath\":[\"children\",\"/_not-found\",\"children\"],\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$L4\",null,{}],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":\"$undefined\",\"notFoundStyles\":\"$undefined\"}]],null]},[[null,[\"$\",\"html\",null,{\"lang\":\"zh-Hant\",\"children\":[\"$\",\"body\",null,{\"style\":{\"margin\":0,\"fontFamily\":\"system-ui, -apple-system, Segoe UI, Roboto\"},\"children\":[\"$\",\"$L3\",null,{\"parallelRouterKey\":\"children\",\"segmentPath\":[\"children\"],\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$L4\",null,{}],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":[[\"$\",\"title\",null,{\"children\":\"404: This page could not be found.\"}],[\"$\",\"div\",null,{\"style\":\"$5\",\"children\":[\"$\",\"div\",null,{\"children\":[[\"$\",\"style\",null,{\"dangerouslySetInnerHTML\":{\"__html\":\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\"}}],[\"$\",\"h1\",null,{\"className\":\"next-error-h1\",\"style\":\"$6\",\"children\":\"404\"}],[\"$\",\"div\",null,{\"style\":\"$7\",\"children\":[\"$\",\"h2\",null,{\"style\":\"$8\",\"children\":\"This page could not be found.\"}]}]]}]}]],\"notFoundStyles\":[]}]}]}]],null],null],\"couldBeIntercepted\":false,\"initialHead\":[[\"$\",\"meta\",null,{\"name\":\"robots\",\"content\":\"noindex\"}],\"$L9\"],\"globalErrorComponent\":\"$a\",\"missingSlots\":\"$Wb\"}]\n"])</script><script>self.__next_f.push([1,"9:[[\"$\",\"meta\",\"0\",{\"name\":\"viewport\",\"content\":\"width=device-width, initial-scale=1\"}],[\"$\",\"meta\",\"1\",{\"charSet\":\"utf-8\"}],[\"$\",\"title\",\"2\",{\"children\":\"龜馬山 goLine 平台\"}],[\"$\",\"meta\",\"3\",{\"name\":\"description\",\"content\":\"龜馬山平台（LINE 登入 / 打卡 / 服務 / 排班）\"}]]\n2:null\n"])</script></body></html>
  - ping-admin：<!DOCTYPE html><html lang="zh-Hant"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack-e17383529fe6c8b6.js"/><script src="/_next/static/chunks/fd9d1056-9f91b5e418130764.js" async=""></script><script src="/_next/static/chunks/117-b06ad745578f0d64.js" async=""></script><script src="/_next/static/chunks/main-app-2dcde4753ea0d175.js" async=""></script><meta name="robots" content="noindex"/><title>404: This page could not be found.</title><title>龜馬山 goLine 平台</title><meta name="description" content="龜馬山平台（LINE 登入 / 打卡 / 服務 / 排班）"/><script src="/_next/static/chunks/polyfills-42372ed130431b0a.js" noModule=""></script></head><body style="margin:0;font-family:system-ui, -apple-system, Segoe UI, Roboto"><div style="font-family:system-ui,&quot;Segoe UI&quot;,Roboto,Helvetica,Arial,sans-serif,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;;height:100vh;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center"><div><style>body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}</style><h1 class="next-error-h1" style="display:inline-block;margin:0 20px 0 0;padding:0 23px 0 0;font-size:24px;font-weight:500;vertical-align:top;line-height:49px">404</h1><div style="display:inline-block"><h2 style="font-size:14px;font-weight:400;line-height:49px;margin:0">This page could not be found.</h2></div></div></div><script src="/_next/static/chunks/webpack-e17383529fe6c8b6.js" async=""></script><script>(self.__next_f=self.__next_f||[]).push([0]);self.__next_f.push([2,null])</script><script>self.__next_f.push([1,"1:I[2846,[],\"\"]\n3:I[4707,[],\"\"]\n4:I[6423,[],\"\"]\na:I[1060,[],\"\"]\n5:{\"fontFamily\":\"system-ui,\\\"Segoe UI\\\",Roboto,Helvetica,Arial,sans-serif,\\\"Apple Color Emoji\\\",\\\"Segoe UI Emoji\\\"\",\"height\":\"100vh\",\"textAlign\":\"center\",\"display\":\"flex\",\"flexDirection\":\"column\",\"alignItems\":\"center\",\"justifyContent\":\"center\"}\n6:{\"display\":\"inline-block\",\"margin\":\"0 20px 0 0\",\"padding\":\"0 23px 0 0\",\"fontSize\":24,\"fontWeight\":500,\"verticalAlign\":\"top\",\"lineHeight\":\"49px\"}\n7:{\"display\":\"inline-block\"}\n8:{\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":\"49px\",\"margin\":0}\nb:[]\n"])</script><script>self.__next_f.push([1,"0:[\"$\",\"$L1\",null,{\"buildId\":\"wonLN-VHs4e6ITrNqwLyT\",\"assetPrefix\":\"\",\"urlParts\":[\"\",\"_not-found\"],\"initialTree\":[\"\",{\"children\":[\"/_not-found\",{\"children\":[\"__PAGE__\",{}]}]},\"$undefined\",\"$undefined\",true],\"initialSeedData\":[\"\",{\"children\":[\"/_not-found\",{\"children\":[\"__PAGE__\",{},[[\"$L2\",[[\"$\",\"title\",null,{\"children\":\"404: This page could not be found.\"}],[\"$\",\"div\",null,{\"style\":{\"fontFamily\":\"system-ui,\\\"Segoe UI\\\",Roboto,Helvetica,Arial,sans-serif,\\\"Apple Color Emoji\\\",\\\"Segoe UI Emoji\\\"\",\"height\":\"100vh\",\"textAlign\":\"center\",\"display\":\"flex\",\"flexDirection\":\"column\",\"alignItems\":\"center\",\"justifyContent\":\"center\"},\"children\":[\"$\",\"div\",null,{\"children\":[[\"$\",\"style\",null,{\"dangerouslySetInnerHTML\":{\"__html\":\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\"}}],[\"$\",\"h1\",null,{\"className\":\"next-error-h1\",\"style\":{\"display\":\"inline-block\",\"margin\":\"0 20px 0 0\",\"padding\":\"0 23px 0 0\",\"fontSize\":24,\"fontWeight\":500,\"verticalAlign\":\"top\",\"lineHeight\":\"49px\"},\"children\":\"404\"}],[\"$\",\"div\",null,{\"style\":{\"display\":\"inline-block\"},\"children\":[\"$\",\"h2\",null,{\"style\":{\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":\"49px\",\"margin\":0},\"children\":\"This page could not be found.\"}]}]]}]}]],null],null],null]},[null,[\"$\",\"$L3\",null,{\"parallelRouterKey\":\"children\",\"segmentPath\":[\"children\",\"/_not-found\",\"children\"],\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$L4\",null,{}],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":\"$undefined\",\"notFoundStyles\":\"$undefined\"}]],null]},[[null,[\"$\",\"html\",null,{\"lang\":\"zh-Hant\",\"children\":[\"$\",\"body\",null,{\"style\":{\"margin\":0,\"fontFamily\":\"system-ui, -apple-system, Segoe UI, Roboto\"},\"children\":[\"$\",\"$L3\",null,{\"parallelRouterKey\":\"children\",\"segmentPath\":[\"children\"],\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$L4\",null,{}],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":[[\"$\",\"title\",null,{\"children\":\"404: This page could not be found.\"}],[\"$\",\"div\",null,{\"style\":\"$5\",\"children\":[\"$\",\"div\",null,{\"children\":[[\"$\",\"style\",null,{\"dangerouslySetInnerHTML\":{\"__html\":\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\"}}],[\"$\",\"h1\",null,{\"className\":\"next-error-h1\",\"style\":\"$6\",\"children\":\"404\"}],[\"$\",\"div\",null,{\"style\":\"$7\",\"children\":[\"$\",\"h2\",null,{\"style\":\"$8\",\"children\":\"This page could not be found.\"}]}]]}]}]],\"notFoundStyles\":[]}]}]}]],null],null],\"couldBeIntercepted\":false,\"initialHead\":[[\"$\",\"meta\",null,{\"name\":\"robots\",\"content\":\"noindex\"}],\"$L9\"],\"globalErrorComponent\":\"$a\",\"missingSlots\":\"$Wb\"}]\n"])</script><script>self.__next_f.push([1,"9:[[\"$\",\"meta\",\"0\",{\"name\":\"viewport\",\"content\":\"width=device-width, initial-scale=1\"}],[\"$\",\"meta\",\"1\",{\"charSet\":\"utf-8\"}],[\"$\",\"title\",\"2\",{\"children\":\"龜馬山 goLine 平台\"}],[\"$\",\"meta\",\"3\",{\"name\":\"description\",\"content\":\"龜馬山平台（LINE 登入 / 打卡 / 服務 / 排班）\"}]]\n2:null\n"])</script></body></html>


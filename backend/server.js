// server.js
// 引入必要的函式庫
import express from 'express';
import fetch from 'node-fetch'; // 如果 Node.js >= 18, 可以嘗試使用內建 fetch
import 'dotenv/config'; // 用來讀取 .env 檔案中的設定 (環境變數)

// 建立 Express 應用程式
const app = express();
// 設定伺服器監聽的連接埠 (Port)，預設是 3000
const PORT = process.env.PORT || 3000;

// 設定 Express 可以解析 JSON 格式的請求主體
app.use(express.json());

// 從 .env 檔案中讀取你的 LINE Channel ID 和 Secret
// 請確保你已經在 .env 檔案中正確設定了這兩個值
const LINE_CLIENT_ID = process.env.LINE_CLIENT_ID || '2008269293'; // 你的 LINE Channel ID
const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET; // 你的 LINE Channel Secret (請確保已設定)

// 檢查是否正確設定 Secret
if (!LINE_CLIENT_SECRET) {
    console.error('錯誤：請在 .env 檔案中設定 LINE_CLIENT_SECRET');
    process.exit(1); // 如果沒有設定，停止程式
}

// 定義一個路由，當收到 POST 請求到 /api/line/callback 時執行以下函數
app.post('/api/line/callback', async (req, res) => {
    console.log('收到前端 POST 請求到 /api/line/callback');

    // 從前端送來的請求主體中取得授權碼 (code)、回傳網址 (redirect_uri) 和用戶端 ID (client_id)
    const { code, redirect_uri, client_id } = req.body;

    // 檢查是否所有必要的參數都提供了
    if (!code || !redirect_uri || !client_id) {
        console.error('錯誤：前端傳來的參數不足', { code, redirect_uri, client_id });
        // 如果缺少參數，回傳錯誤訊息給前端
        return res.status(400).json({ error: '缺少必要參數: code, redirect_uri, client_id' });
    }

    // 確認前端傳來的 client_id 與設定檔中的 ID 一致 (安全檢查)
    if (client_id !== LINE_CLIENT_ID) {
        console.error('錯誤：前端傳來的 Client ID 不符', { received: client_id, expected: LINE_CLIENT_ID });
        return res.status(400).json({ error: 'Client ID 不符' });
    }

    // 確認前端傳來的 redirect_uri 與設定相符 (安全檢查)
    const expectedRedirectUri = 'https://guimashen.vercel.app/auth/callback'; // 請確保這個 URL 與 LINE Console 設定一致
    if (redirect_uri !== expectedRedirectUri) {
        console.error('錯誤：前端傳來的 Redirect URI 不符', { received: redirect_uri, expected: expectedRedirectUri });
        return res.status(400).json({ error: 'Redirect URI 不符' });
    }

    try {
        console.log('開始向 LINE API 交換 Access Token...');

        // 向 LINE API 發送 POST 請求，使用授權碼換取 Access Token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code', // 固定值
                code: code,                       // 從前端取得的授權碼
                redirect_uri: redirect_uri,       // 從前端取得的回傳網址
                client_id: client_id,             // 從前端取得的用戶端 ID
                client_secret: LINE_CLIENT_SECRET, // 後端儲存的用戶端密鑰 (絕不暴露給前端！)
            }),
        });

        // 檢查 LINE API 是否回傳了錯誤
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text(); // 讀取錯誤回應文字
            console.error('LINE API 回傳錯誤 (Token Exchange):', tokenResponse.status, errorText);
            // 將 LINE API 的錯誤回傳給前端
            return res.status(tokenResponse.status).json({ error: `取得 Token 失敗: ${errorText}` });
        }

        // 如果成功，解析 LINE API 回傳的 JSON 資料，取得 access_token
        const tokenData = await tokenResponse.json();
        console.log('✓ Access Token 交換成功');

        console.log('開始向 LINE API 取得使用者資料...');

        // 使用剛取得的 access_token 向 LINE API 取得使用者的基本資料
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}` // 在標頭中放入 access_token
            }
        });

        // 檢查取得資料的請求是否成功
        if (!profileResponse.ok) {
            const errorText = await profileResponse.text();
            console.error('LINE API 回傳錯誤 (Get Profile):', profileResponse.status, errorText);
            return res.status(profileResponse.status).json({ error: `取得 Profile 失敗: ${errorText}` });
        }

        // 如果成功，解析 LINE API 回傳的使用者資料
        const profile = await profileResponse.json();
        console.log('✓ 使用者資料取得成功:', profile);

        // 將取得的使用者資料回傳給前端
        res.json({ profile: profile });

    } catch (error) {
        // 如果過程中發生任何錯誤 (例如網路問題)
        console.error('處理過程中發生未預期錯誤:', error);
        res.status(500).json({ error: '伺服器內部錯誤，請稍後再試' });
    }
});

// 啟動伺服器，開始監聽指定的連接埠
app.listen(PORT, () => {
    console.log(`後端伺服器已啟動，正在 http://localhost:${PORT} 上執行`);
    console.log(`請確保前端程式碼中的 fetch URL 指向 http://localhost:${PORT}/api/line/callback`);
});

// 匯出 app，供其他檔案使用 (通常在框架中會用到)
export default app;

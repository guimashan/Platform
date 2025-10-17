// api/line-callback.js

// 為了安全，我們使用 Serverless 環境變數來儲存密鑰
const CHANNEL_ID = '2008269293'; // 您的 LINE Channel ID (已在前端暴露，但此處使用環境變數更佳)
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET; // ⚠️ 必須設定在 Vercel 環境變數中！
const REDIRECT_URI = 'https://guimashen.vercel.app/api/line-callback'; // ⚡️ 修改這裡！
/**
 * 主要處理函式
 * 負責從 LINE 獲取 Access Token 和用戶資料
 */
export default async (req, res) => {
    // 檢查是否為 GET 請求 (LINE 授權流程通常是 GET)
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }

    const { code, state, error, error_description } = req.query;

    if (error) {
        console.error('LINE 授權錯誤:', error_description);
        return res.status(400).send(`
            <script>
                alert('LINE 授權失敗: ${error_description}');
                window.location.href = '/checkin/';
            </script>
        `);
    }

    if (!code) {
        return res.status(400).json({ status: 'error', message: '缺少授權碼 (code)' });
    }
    
    let originalRedirectUrl = '/checkin/';
    let parsedState = {};
    
    try {
        // 解析 state 以獲取原始導向頁面
        parsedState = JSON.parse(decodeURIComponent(state));
        originalRedirectUrl = parsedState.redirect || '/checkin/';
    } catch (e) {
        console.warn('無法解析 state 參數，導向首頁');
    }

    try {
        // 1. 使用 code 交換 Access Token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CHANNEL_ID,
                client_secret: CHANNEL_SECRET // 使用安全密鑰
            }).toString()
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('交換 Token 失敗:', errorText);
            throw new Error('交換 Token 失敗: ' + (errorText.includes('invalid_client_secret') ? 'Client Secret 錯誤' : errorText));
        }

        const tokenData = await tokenResponse.json();
        const { access_token, id_token } = tokenData;

        // 2. 解析 ID Token 獲取用戶資訊 (Base64 解碼)
        const [header, payload, signature] = id_token.split('.');
        const userPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
        
        const lineUserId = userPayload.sub;
        const displayName = userPayload.name;
        const pictureUrl = userPayload.picture;

        // 3. (可選/推薦) 將用戶資訊更新到您的 Firebase 'users' 集合中
        // 由於我們沒有在此檔案中初始化 admin SDK，我們暫時跳過此步驟
        // 確保用戶資料 (特別是 role) 是由其他服務 (例如後台新增) 進行管理。

        // 4. 將關鍵資訊存入前端的 localStorage 並導回原始頁面
        // 使用一個 HTML 頁面來執行 JavaScript，將資訊寫入 localStorage
        const successHtml = `
            <!DOCTYPE html>
            <html>
            <head><title>登入成功</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <div style="
                    background: #e8f5e9; 
                    color: #2e7d32; 
                    padding: 20px; 
                    border-radius: 10px;
                    border: 1px solid #c8e6c9;
                ">
                    <h2>✅ 登入處理中...</h2>
                    <p>正在將您導回管理頁面...</p>
                    <div class="spinner"></div>
                </div>
                <script>
                    console.log('LINE 登入資訊寫入 localStorage...');
                    localStorage.setItem('line_user_id', '${lineUserId}');
                    localStorage.setItem('line_display_name', '${displayName}');
                    localStorage.setItem('line_picture_url', '${pictureUrl || ''}');
                    localStorage.setItem('line_login_timestamp', Date.now());
                    
                    // 清除歷史記錄中的 code 和 state 參數
                    window.history.replaceState({}, document.title, "${originalRedirectUrl}");

                    // 導向原始頁面
                    window.location.href = "${originalRedirectUrl}";
                </script>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(successHtml);

    } catch (error) {
        console.error('LINE 登入處理失敗:', error);
        
        // 導向錯誤頁面或彈出警示
        return res.status(500).send(`
            <script>
                alert('登入失敗，請稍後重試。錯誤詳情：${error.message.replace(/'/g, "\\'") }');
                window.location.href = '/checkin/'; // 導回首頁
            </script>
        `);
    }
};

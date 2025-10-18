// 這是一個 Vercel 無伺服器函式 (Serverless Function)。
// 它扮演一個安全的後端角色，專門處理與 LINE API 的通訊。
// 這樣做的關鍵是為了保護您的 Channel Secret 不會洩漏在前端。

export default async function handler(request, response) {
    // 我們只允許 POST 方法來存取這個端點
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 從前端傳來的請求中讀取 code
        const { code } = request.body;
        if (!code) {
            return response.status(400).json({ error: 'Authorization code is required.' });
        }

        // 從您的專案資訊中讀取
        const LINE_CHANNEL_ID = '2008269293';
        // !!重要!! 這個金鑰必須設定在 Vercel 的環境變數中，而不是寫死在這裡
        const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET; 
        const LINE_REDIRECT_URI = 'https://go.guimashan.org.tw/checkin/index.html';

        if (!LINE_CHANNEL_SECRET) {
             console.error('錯誤：LINE_CHANNEL_SECRET 環境變數未設定。');
             return response.status(500).json({ error: '伺服器設定錯誤。' });
        }

        // 步驟 1：用授權碼(code)換取 access token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: LINE_REDIRECT_URI,
                client_id: LINE_CHANNEL_ID,
                client_secret: LINE_CHANNEL_SECRET,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('從 LINE 取得 token 時發生錯誤:', tokenData.error_description);
            return response.status(400).json({ error: '無效的授權碼。', details: tokenData.error_description });
        }

        // 步驟 2：驗證 ID token 以取得使用者個人資料
        const profileResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                id_token: tokenData.id_token,
                client_id: LINE_CHANNEL_ID,
            }),
        });

        const profileData = await profileResponse.json();

         if (profileData.error) {
            console.error('驗證 ID token 時發生錯誤:', profileData.error_description);
            return response.status(400).json({ error: '無效的 ID token。', details: profileData.error_description });
        }

        // 步驟 3：將處理乾淨的使用者資料回傳給前端
        const userData = {
            userId: profileData.sub,       // LINE 的使用者唯一 ID
            displayName: profileData.name,   // LINE 的使用者名稱
            pictureUrl: profileData.picture, // LINE 的使用者頭像 URL
        };

        response.status(200).json(userData);

    } catch (error) {
        console.error('伺服器內部錯誤:', error);
        response.status(500).json({ error: '發生未預期的錯誤。' });
    }
}

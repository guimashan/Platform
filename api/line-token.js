// 導入 node-fetch 用於發送 HTTP 請求
import fetch from 'node-fetch';

// ❗ 安全地從 Vercel 環境變數讀取秘密
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

// Vercel Serverless 函式入口點
export default async (req, res) => {
    // 1. 僅處理 POST 請求 (更安全)
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // 2. 從前端請求中取得 code 和 redirect_uri
    const { code, redirect_uri } = req.body;

    if (!code || !redirect_uri) {
        return res.status(400).json({ error: 'Missing code or redirect_uri' });
    }

    try {
        // --- A. 請求 Access Token (Token 交換) ---
        const tokenRequestBody = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri,
            client_id: LINE_CHANNEL_ID,
            client_secret: LINE_CHANNEL_SECRET, // ❗ 在後端安全地使用秘密
        });

        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenRequestBody,
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('LINE Token Error:', errorData);
            // 由於 400 錯誤是來自 LINE 的，我們直接返回給前端
            return res.status(400).json({
                error: 'Token Exchange Failed',
                details: errorData.error_description || errorData.error || 'Unknown LINE error',
            });
        }

        const tokenData = await tokenResponse.json();
        const { access_token } = tokenData;

        // --- B. 請求使用者 Profile ---
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { 'Authorization': `Bearer ${access_token}` },
        });

        if (!profileResponse.ok) {
             return res.status(500).json({ error: 'Failed to get user profile' });
        }

        const profile = await profileResponse.json();

        // 3. 成功：將 LINE 的資料回傳給前端
        res.status(200).json({
            success: true,
            user: {
                userId: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
            },
            // ⚠️ 建議不要將 Access Token 直接傳回前端，但為了簡化流程，您可以先傳回
            accessToken: access_token 
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

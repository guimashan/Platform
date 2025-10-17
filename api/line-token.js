// api/line-callback.js
import fetch from 'node-fetch'; // 如果您使用的是 Vercel Edge Functions，可能需要配置 fetch 

// 从 Vercel 环境变数安全读取
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { code, redirect_uri } = req.body;

    if (!code || !redirect_uri) {
        return res.status(400).json({ error: 'Missing code or redirect_uri' });
    }

    try {
        // A. 請求 Access Token (在後端安全執行)
        const tokenRequestBody = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri,
            client_id: LINE_CHANNEL_ID,
            client_secret: LINE_CHANNEL_SECRET, // ❗ 安全使用
        });

        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenRequestBody,
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            return res.status(tokenResponse.status).json({
                error: 'Token Exchange Failed',
                details: errorData.error_description || errorData.error || 'Unknown LINE error',
            });
        }

        const tokenData = await tokenResponse.json();
        const { access_token } = tokenData;

        // B. 請求使用者 Profile
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { 'Authorization': `Bearer ${access_token}` },
        });
        
        const profile = await profileResponse.json();

        // C. 將成功結果回傳前端
        res.status(200).json({
            success: true,
            user: {
                userId: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
            },
            accessToken: access_token // 傳回 token，但請注意安全
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

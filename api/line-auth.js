// Vercel Serverless Function
// 檔案路徑: /api/line-auth.js

export default async function handler(request, response) {
    // 只接受 POST 請求
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { code, redirect_uri } = request.body;
    const client_id = '2008269293'; 
    
    // 從環境變數讀取 Channel Secret，確保安全
    const client_secret = process.env.LINE_CHANNEL_SECRET;

    if (!code || !redirect_uri || !client_secret) {
        return response.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        // 步驟 1: 用 code 換取 access token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri,
                client_id: client_id,
                client_secret: client_secret,
            }),
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
            console.error('LINE Token API Error:', tokenData);
            throw new Error(tokenData.error_description || 'Failed to get access token.');
        }

        const accessToken = tokenData.access_token;

        // 步驟 2: 用 access token 取得使用者資料
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const profileData = await profileResponse.json();
        
        if (!profileResponse.ok) {
            throw new Error(profileData.message || 'Failed to get user profile.');
        }
        
        // 檢查 pictureUrl 是否存在，如果不存在則提供一個預設頭像
        const pictureUrl = profileData.pictureUrl || 'https://placehold.co/200x200/E2E8F0/A0AEC0?text=User';

        // 成功取得資料，回傳給前端
        response.status(200).json({
            userId: profileData.userId,
            displayName: profileData.displayName,
            pictureUrl: pictureUrl,
        });

    } catch (error) {
        console.error('LINE Auth Error:', error);
        response.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}


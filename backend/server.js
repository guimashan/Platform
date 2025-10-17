import express from 'express';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const LINE_CLIENT_ID = process.env.LINE_CLIENT_ID || '2008269293';
const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET;

if (!LINE_CLIENT_SECRET) {
    console.error('錯誤：請設定 LINE_CLIENT_SECRET');
    process.exit(1);
}

app.post('/api/line/callback', async (req, res) => {
    const { code, redirect_uri, client_id } = req.body;

    if (!code || !redirect_uri || !client_id) {
        return res.status(400).json({ error: '缺少必要參數' });
    }

    if (client_id !== LINE_CLIENT_ID) {
        return res.status(400).json({ error: 'Client ID 不符' });
    }

    const expectedRedirectUri = 'https://guimashen.vercel.app/auth/callback';
    if (redirect_uri !== expectedRedirectUri) {
        return res.status(400).json({ error: 'Redirect URI 不符' });
    }

    try {
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri,
                client_id: client_id,
                client_secret: LINE_CLIENT_SECRET,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            return res.status(tokenResponse.status).json({ error: `取得 Token 失敗: ${errorText}` });
        }

        const tokenData = await tokenResponse.json();

        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });

        if (!profileResponse.ok) {
            const errorText = await profileResponse.text();
            return res.status(profileResponse.status).json({ error: `取得 Profile 失敗: ${errorText}` });
        }

        const profile = await profileResponse.json();
        res.json({ profile: profile });

    } catch (error) {
        console.error('處理錯誤:', error);
        res.status(500).json({ error: '伺服器內部錯誤' });
    }
});

app.listen(PORT, () => {
    console.log(`伺服器執行於 http://localhost:${PORT}`);
});

export default app;

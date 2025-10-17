// /api/line-token.js
// Vercel API Route 處理 LINE Login Token 交換

export default async function handler(req, res) {
  // 設定 CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 處理 OPTIONS 請求 (預檢請求)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // 從環境變數取得 LINE 應用程式資訊
    const CLIENT_ID = process.env.LINE_CLIENT_ID;
    const CLIENT_SECRET = process.env.LINE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.LINE_REDIRECT_URI || 'https://guimashen.vercel.app/auth/callback';

    // 準備請求參數
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);

    // 向 LINE API 請求 access token
    const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('LINE API Error:', data);
      return res.status(response.status).json({
        error: 'Failed to get access token',
        details: data
      });
    }

    // 使用 access token 取得使用者資料
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${data.access_token}`
      }
    });

    const profile = await profileResponse.json();

    // 回傳 token 和使用者資料
    return res.status(200).json({
      success: true,
      accessToken: data.access_token,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      profile: profile
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Vercel Serverless Function
// 檔案路徑: /api/line-auth.js

// 引入 Firebase Admin SDK
import admin from 'firebase-admin';

// 初始化 Firebase Admin
// 檢查是否已經初始化，避免重複執行
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { code, redirect_uri } = request.body;
    const client_id = '2008269293';
    const client_secret = process.env.LINE_CHANNEL_SECRET;

    if (!code || !redirect_uri || !client_secret) {
        return response.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        // 1. 用 code 換取 LINE access token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri,
                client_id,
                client_secret,
            }),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error(`LINE Token API Error: ${JSON.stringify(tokenData)}`);

        // 2. 用 access token 取得 LINE 使用者資料
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profileData = await profileResponse.json();
        if (!profileResponse.ok) throw new Error(`LINE Profile API Error: ${JSON.stringify(profileData)}`);

        const { userId, displayName } = profileData;
        const pictureUrl = profileData.pictureUrl || 'https://placehold.co/200x200/E2E8F0/A0AEC0?text=User';

        // 3. 建立或更新 Firestore 中的使用者資料
        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        const now = new Date();
        const userSnap = await userRef.get();

        if (userSnap.exists) {
            await userRef.update({
                displayName,
                pictureUrl,
                lastLoginAt: now,
            });
        } else {
            await userRef.set({
                displayName,
                pictureUrl,
                role: 'user',
                createdAt: now,
                lastLoginAt: now,
            });
        }

        // 4. 產生 Firebase 自訂令牌 (Custom Token)
        const firebaseToken = await admin.auth().createCustomToken(userId);

        // 5. 將令牌回傳給前端
        response.status(200).json({ token: firebaseToken });

    } catch (error) {
        console.error('Authentication process failed:', error);
        response.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}


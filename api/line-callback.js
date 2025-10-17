// api/line-callback.js - 處理 LINE 登入回呼 (已加入 Firebase Admin SDK 和角色獲取)

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// 為了安全，我們使用 Serverless 環境變數來儲存密鑰
const CHANNEL_ID = '2008269293'; 
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
// ⚠️ 確保此 URL 與 LINE Developers Console 中的設定完全一致！
const REDIRECT_URI = 'https://guimashen.vercel.app/api/line-callback'; 

// 初始化 Firebase Admin SDK
let db;
try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountBase64 && projectId) {
        const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountJson);

        if (!initializeApp.length) { 
            initializeApp({
                credential: credential.cert(serviceAccount),
                projectId: projectId,
            });
        }
        db = getFirestore();
    } else {
        console.warn('Firebase Admin SDK 未初始化：缺少環境變數。將跳過用戶角色獲取。');
    }
} catch (error) {
    console.error("Firebase Admin 初始化失敗:", error.message);
}


/**
 * 輔助函式：從 Firestore 獲取用戶角色
 * @param {string} userId - LINE 用戶 ID
 * @returns {string} 用戶角色 (例如: 'admin', 'user')
 */
async function getUserRole(userId) {
    if (!db || !userId) return 'user'; // 如果資料庫未初始化，預設為普通用戶
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        // 如果文件不存在或沒有 role 欄位，預設為 'user'
        const role = userDoc.exists ? (userDoc.data().role || 'user') : 'user';

        // 💡 推薦：在此處更新用戶的 displayName/pictureUrl/lastLoginAt (未包含在範例中)

        return role;
    } catch (error) {
        console.error("獲取使用者角色失敗:", error);
        return 'user';
    }
}


/**
 * 主要處理函式
 */
export default async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }

    const { code, state, error, error_description } = req.query;

    // ... (錯誤處理保持不變)
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
    
    try {
        const parsedState = JSON.parse(decodeURIComponent(state));
        originalRedirectUrl = parsedState.redirect || '/checkin/';
    } catch (e) {
        console.warn('無法解析 state 參數，導向首頁');
    }

    try {
        // 1. 使用 code 交換 Access Token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            // ... (headers, body 保持不變)
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CHANNEL_ID,
                client_secret: CHANNEL_SECRET
            }).toString()
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('交換 Token 失敗:', errorText);
            throw new Error('交換 Token 失敗: ' + (errorText.includes('invalid_client_secret') ? 'Client Secret 錯誤' : errorText));
        }

        const tokenData = await tokenResponse.json();
        const { id_token } = tokenData;

        // 2. 解析 ID Token 獲取用戶資訊
        const [header, payload, signature] = id_token.split('.');
        const userPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
        
        const lineUserId = userPayload.sub;
        const displayName = userPayload.name;
        const pictureUrl = userPayload.picture;

        // 3. ⭐️ 關鍵步驟：從 Firestore 獲取用戶角色 ⭐️
        const userRole = await getUserRole(lineUserId);

        // 4. 將關鍵資訊存入前端的 localStorage 並導回原始頁面
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
                </div>
                <script>
                    console.log('LINE 登入資訊寫入 localStorage...');
                    localStorage.setItem('line_user_id', '${lineUserId}');
                    localStorage.setItem('line_display_name', '${displayName}');
                    localStorage.setItem('line_picture_url', '${pictureUrl || ''}');
                    localStorage.setItem('line_login_timestamp', Date.now());
                    
                    // ⭐️ 確保將用戶角色寫入 localStorage ⭐️
                    localStorage.setItem('line_user_role', '${userRole}'); 
                    
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
        // ... (錯誤處理保持不變)
        console.error('LINE 登入處理失敗:', error);
        return res.status(500).send(`
            <script>
                alert('登入失敗，請稍後重試。錯誤詳情：${error.message.replace(/'/g, "\\'") }');
                window.location.href = '/checkin/'; // 導回首頁
            </script>
        `);
    }
};

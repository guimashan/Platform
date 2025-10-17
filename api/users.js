// api/users.js
import admin from 'firebase-admin';

// 確保 Firebase Admin SDK 只初始化一次
if (!admin.apps.length) {
    try {
        // 從 Vercel 環境變數中讀取 BASE64 編碼的服務帳號金鑰
        const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const projectId = process.env.FIREBASE_PROJECT_ID;

        if (!serviceAccountBase64 || !projectId) {
            throw new Error('缺少必要的環境變數：FIREBASE_PROJECT_ID 或 FIREBASE_SERVICE_ACCOUNT_KEY');
        }

        // 解碼 Base64 字串以獲得服務帳號 JSON 物件
        const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${projectId}.firebaseio.com` // 依您的專案 ID 設定
        });

    } catch (error) {
        console.error("Firebase Admin 初始化失敗:", error.message);
    }
}

const db = admin.firestore();

// ----------------------------------------------------
// API 主處理函式：獲取單一使用者資訊
// ----------------------------------------------------

export default async (req, res) => {
    // 這個 API 僅支援 GET 請求
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }

    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ status: 'error', message: '缺少使用者 ID 參數' });
    }

    try {
        console.log(`查詢使用者資料: ${userId}`);
        
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            // 如果使用者不存在，則預設為 'user' 角色
            return res.status(200).json({ 
                status: 'success', 
                role: 'user', 
                message: '使用者資料庫中不存在，預設為普通使用者'
            });
        }
        
        const userData = userDoc.data();
        
        // 只返回前端需要的角色資訊
        return res.status(200).json({ 
            status: 'success', 
            role: userData.role || 'user', 
            displayName: userData.displayName || ''
        });

    } catch (error) {
        console.error(`API 錯誤 (GET /api/users):`, error);
        
        return res.status(500).json({ 
            status: 'error', 
            message: '伺服器錯誤，無法驗證權限', 
            details: error.message 
        });
    }
};

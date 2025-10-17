// api/admin-checkins.js - 處理管理頁面數據請求的 API (已加入權限檢查)

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// ❗ 安全：從 Vercel 環境變數中讀取服務帳號私鑰
// 確保您已在 Vercel 設定了 FIREBASE_SERVICE_ACCOUNT_KEY 和 FIREBASE_PROJECT_ID 環境變數
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!serviceAccountBase64 || !projectId) {
    console.error('Firebase Admin 初始化錯誤: 缺少必要的環境變數。');
    // 在 Vercel 環境下，如果環境變數缺失，程式碼會繼續執行但無法連接 Firebase
    // 這裡不拋出錯誤，讓程式碼向下走，以便在 try/catch 區塊中回傳 500
}

let db;

try {
    // 解碼 Base64 字串以獲得服務帳號 JSON 物件
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    // 使用 Admin SDK 初始化 Firebase (後端專用)
    if (!initializeApp.length) { // 避免重複初始化
        initializeApp({
            credential: credential.cert(serviceAccount),
            projectId: projectId,
        });
    }
    db = getFirestore();
} catch (error) {
    console.error("Firebase Admin 初始化失敗:", error.message);
}


// ----------------------------------------------------
// 權限檢查工具
// ----------------------------------------------------

// 檢查使用者是否為管理員 (Admin, Superadmin) 或 PowerUser
async function checkAdminRole(userId) {
    if (!db || !userId) return false;
    
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return false;
        
        const role = userDoc.data().role;
        // 假設 'admin', 'superadmin', 'poweruser' 都可以查看簽到記錄
        return ['admin', 'superadmin', 'poweruser'].includes(role); 
    } catch (error) {
        console.error("檢查管理員權限失敗:", error);
        return false;
    }
}


// ----------------------------------------------------
// API 主處理函式
// ----------------------------------------------------

export default async (req, res) => {
    
    // 1. 確保 Firebase 連線成功
    if (!db) {
        return res.status(500).json({ 
            error: '伺服器配置錯誤', 
            details: 'Firebase Admin SDK 初始化失敗，請檢查環境變數。' 
        });
    }

    // 2. 身份驗證：從 Header 獲取當前操作者的 ID (由前端登入成功後傳遞)
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ 
            status: 'error', 
            message: '未提供使用者 ID，拒絕存取。' 
        });
    }

    // 3. 權限檢查：必須是管理員才能查看紀錄
    try {
        const isAdmin = await checkAdminRole(userId);
        if (!isAdmin) {
            return res.status(403).json({ 
                status: 'error', 
                message: '權限不足',
                details: '您沒有權限查看簽到記錄。'
            });
        }
    } catch (error) {
         console.error('權限檢查發生錯誤:', error);
         return res.status(500).json({ status: 'error', message: '權限檢查失敗。' });
    }
    
    // --- 權限檢查通過，開始執行業務邏輯 ---

    try {
        console.log('Admin API: 正在獲取所有簽到記錄...');

        const checkinsRef = db.collection('checkins');
        const snapshot = await checkinsRef.orderBy('createdAt', 'desc').get();

        const allRecords = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            allRecords.push({
                id: doc.id,
                // 將 Timestamp 轉換為前端容易處理的毫秒時間戳
                timestamp: data.createdAt ? data.createdAt.toMillis() : Date.now(),
                ...data,
            });
        });

        console.log(`Admin API: 成功獲取 ${allRecords.length} 筆記錄`);

        // 將資料成功回傳給前端
        res.status(200).json({ records: allRecords });

    } catch (error) {
        console.error('Admin API Error:', error);
        res.status(500).json({ error: 'Failed to fetch checkin records.', details: error.message });
    }
};

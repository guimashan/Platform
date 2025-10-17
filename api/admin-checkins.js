// api/admin-checkins.js - 處理管理頁面數據請求的 API

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// ❗ 安全：從 Vercel 環境變數中讀取服務帳號私鑰
// 確保您已在 Vercel 設定了 FIREBASE_SERVICE_ACCOUNT_KEY 環境變數
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
);

// 使用 Admin SDK 初始化 Firebase (後端專用)
if (!initializeApp.length) { // 避免重複初始化
    initializeApp({
        credential: credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID, // 確保在 Vercel 設定了此變數
    });
}

const db = getFirestore();

export default async (req, res) => {
    // 雖然這個 API 處理數據，但我們應該先在前端處理好管理員驗證
    // 這裡僅示範數據獲取邏輯，實際應用中應加入JWT或session驗證
    // 來確認請求者是真正的管理員。

    try {
        console.log('Admin API: 正在獲取所有簽到記錄...');

        const checkinsRef = db.collection('checkins');
        // 由於我們需要全部資料進行前端篩選，這裡暫時不加太多 where 條件
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

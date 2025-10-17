// api/users-admin.js
import admin from 'firebase-admin';

// 確保 Firebase Admin SDK 只初始化一次
if (!admin.apps.length) {
    try {
        const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const projectId = process.env.FIREBASE_PROJECT_ID;

        if (!serviceAccountBase64 || !projectId) {
            throw new Error('缺少必要的環境變數：FIREBASE_PROJECT_ID 或 FIREBASE_SERVICE_ACCOUNT_KEY');
        }

        const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${projectId}.firebaseio.com` 
        });

    } catch (error) {
        console.error("Firebase Admin 初始化失敗:", error.message);
    }
}

const db = admin.firestore();

// ----------------------------------------------------
// 權限檢查工具
// ----------------------------------------------------

// 獲取使用者角色
async function getUserRole(userId) {
    if (!userId) return null;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        return userDoc.exists ? (userDoc.data().role || 'user') : null;
    } catch (error) {
        console.error("獲取使用者角色失敗:", error);
        return null;
    }
}

// ----------------------------------------------------
// API 主處理函式
// ----------------------------------------------------

export default async (req, res) => {
    // 從 Header 獲取當前操作的管理員 ID
    const operatorId = req.headers['x-user-id'];

    if (!operatorId) {
        return res.status(401).json({ status: 'error', message: '未提供操作者 ID，拒絕存取' });
    }

    try {
        // 檢查操作者權限：必須是 admin 或 superadmin
        const operatorRole = await getUserRole(operatorId);
        if (!['admin', 'superadmin'].includes(operatorRole)) {
            return res.status(403).json({ 
                status: 'error', 
                message: '權限不足',
                details: '只有系統管理員才能管理使用者。'
            });
        }

        switch (req.method) {
            case 'GET':
                // 獲取所有使用者列表
                const usersSnapshot = await db.collection('users').get();
                const users = usersSnapshot.docs.map(doc => {
                    const data = doc.data();
                    // 將 Firebase Timestamp 轉換為 ISO 8601 格式字串，方便前端解析
                    return {
                        userId: doc.id,
                        displayName: data.displayName || '未知使用者',
                        pictureUrl: data.pictureUrl || '',
                        role: data.role || 'user',
                        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
                        lastLoginAt: data.lastLoginAt ? data.lastLoginAt.toDate().toISOString() : null,
                    };
                });
                return res.status(200).json({ status: 'success', users });

            case 'PUT':
                // 更新使用者角色
                const { userId, newRole } = req.body;

                if (!userId || !newRole) {
                    return res.status(400).json({ status: 'error', message: '缺少使用者 ID 或新角色' });
                }
                
                // 檢查目標使用者是否存在
                const targetDoc = await db.collection('users').doc(userId).get();
                if (!targetDoc.exists) {
                    return res.status(404).json({ status: 'error', message: '找不到目標使用者' });
                }

                const targetRole = targetDoc.data().role || 'user';
                
                // 🚫 安全檢查：Admin (非 Superadmin) 不能修改 Superadmin 的角色
                if (operatorRole === 'admin' && targetRole === 'superadmin') {
                     return res.status(403).json({ 
                         status: 'error', 
                         message: '權限不足',
                         details: '系統管理員不能修改最高系統管理員的角色。'
                     });
                }

                // 執行更新
                await db.collection('users').doc(userId).update({
                    role: newRole,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                return res.status(200).json({ 
                    status: 'success', 
                    message: '使用者角色更新成功', 
                    userId 
                });

            default:
                res.setHeader('Allow', ['GET', 'PUT']);
                return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
        }

    } catch (error) {
        console.error(`API 錯誤 (${req.method} /api/users-admin):`, error);
        
        return res.status(500).json({ 
            status: 'error', 
            message: '伺服器發生未知錯誤', 
            details: error.message 
        });
    }
};

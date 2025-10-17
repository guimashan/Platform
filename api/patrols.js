// api/patrols.js
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
        // 在生產環境中，這個錯誤應該被記錄，但不應阻止程式碼執行
        // 因為 Vercel 會在下次請求時重新嘗試初始化
    }
}

const db = admin.firestore();

// ----------------------------------------------------
// 權限檢查工具
// ----------------------------------------------------

// 檢查使用者是否為管理員 (Admin) 或超級管理員 (Superadmin)
async function checkAdminRole(userId) {
    if (!userId) {
        return false;
    }
    
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return false;
        }
        const role = userDoc.data().role;
        return ['admin', 'superadmin'].includes(role);
    } catch (error) {
        console.error("檢查管理員權限失敗:", error);
        return false;
    }
}

// ----------------------------------------------------
// API 主處理函式
// ----------------------------------------------------

export default async (req, res) => {
    // 獲取用戶 ID（前端從 localStorage 傳遞過來）
    const userId = req.headers['x-user-id'];

    // 檢查非讀取請求 (POST, PUT, DELETE) 的權限
    if (req.method !== 'GET') {
        const isAdmin = await checkAdminRole(userId);
        if (!isAdmin) {
            return res.status(403).json({ 
                status: 'error', 
                message: '權限不足',
                details: '只有管理員才能新增、編輯或刪除巡邏點。'
            });
        }
    }

    try {
        switch (req.method) {
            case 'GET':
                // 讀取所有巡邏點
                const patrolsSnapshot = await db.collection('patrols').get();
                const patrols = patrolsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                return res.status(200).json({ status: 'success', patrols });

            case 'POST':
                // 新增巡邏點
                const newPatrol = req.body;
                if (!newPatrol.name || !newPatrol.lat || !newPatrol.lng || !newPatrol.tolerance) {
                    return res.status(400).json({ status: 'error', message: '缺少必填參數' });
                }
                
                // 使用 name 作為文件 ID
                const docRef = db.collection('patrols').doc(newPatrol.name);
                await docRef.set({
                    name: newPatrol.name,
                    lat: newPatrol.lat,
                    lng: newPatrol.lng,
                    tolerance: newPatrol.tolerance,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                return res.status(201).json({ status: 'success', message: '巡邏點新增成功', id: newPatrol.name });

            case 'PUT':
                // 編輯巡邏點
                const updatedPatrol = req.body;
                const patrolId = updatedPatrol.id;

                if (!patrolId || !updatedPatrol.name || !updatedPatrol.lat || !updatedPatrol.lng || !updatedPatrol.tolerance) {
                    return res.status(400).json({ status: 'error', message: '缺少必填參數或 ID' });
                }

                // 更新操作：確保只更新必要的欄位
                await db.collection('patrols').doc(patrolId).update({
                    name: updatedPatrol.name,
                    lat: updatedPatrol.lat,
                    lng: updatedPatrol.lng,
                    tolerance: updatedPatrol.tolerance,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                return res.status(200).json({ status: 'success', message: '巡邏點更新成功', id: patrolId });

            case 'DELETE':
                // 刪除巡邏點
                const { id: deleteId } = req.body;
                
                if (!deleteId) {
                    return res.status(400).json({ status: 'error', message: '缺少刪除 ID' });
                }

                await db.collection('patrols').doc(deleteId).delete();

                return res.status(200).json({ status: 'success', message: '巡邏點刪除成功', id: deleteId });

            default:
                // 不支援的方法
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
        }

    } catch (error) {
        console.error(`API 錯誤 (${req.method}):`, error);
        
        // 處理常見錯誤
        let statusCode = 500;
        let message = '伺服器發生未知錯誤';
        
        if (error.code === 'not-found') {
            statusCode = 404;
            message = '找不到指定的巡邏點';
        }

        return res.status(statusCode).json({ status: 'error', message, details: error.message });
    }
};

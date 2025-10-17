// admin-checkins.js (新增的部分)
// ... (Firebase 初始化代碼結束後)
const db = getFirestore();

// ----------------------------------------------------
// 權限檢查工具 (複製自 users-admin.js 或 patrols.js)
// ----------------------------------------------------
async function checkAdminRole(userId) {
    if (!userId) return false;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return false;
        const role = userDoc.data().role;
        return ['admin', 'superadmin', 'poweruser'].includes(role); // 依需求調整管理員角色
    } catch (error) {
        console.error("檢查管理員權限失敗:", error);
        return false;
    }
}
// ----------------------------------------------------

export default async (req, res) => {
    // 1. 從 Header 獲取當前操作者的 ID
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ status: 'error', message: '未提供使用者 ID，拒絕存取。' });
    }

    // 2. 檢查操作者權限：必須是 admin, superadmin 或 poweruser 才能查看紀錄
    const isAdmin = await checkAdminRole(userId);
    if (!isAdmin) {
        return res.status(403).json({ 
            status: 'error', 
            message: '權限不足',
            details: '您沒有權限查看簽到記錄。'
        });
    }

    try {
        console.log('Admin API: 正在獲取所有簽到記錄...');
        // ... (後續的資料獲取邏輯保持不變)

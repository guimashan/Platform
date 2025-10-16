// api/[code].js
const admin = require('firebase-admin');

// 檢查是否已經初始化
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// --- 獲取長網址 (從 Firestore 查詢) ---
async function getLongUrl(code) {
  const docRef = db.collection('urls').doc(code);
  const doc = await docRef.get();
  if (doc.exists) {
    return doc.data().longUrl;
  } else {
    return null;
  }
}

// --- 主要的 API 處理函數 ---
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: '缺少短碼' });
  }

  try {
    const longUrl = await getLongUrl(code);

    if (!longUrl) {
      return res.status(404).json({ error: '短網址不存在' });
    }

    res.redirect(307, longUrl);

  } catch (error) {
    console.error('Redirect API Error:', error);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
}

// Vercel config 通常不需要為 GET 請求設定 bodyParser
// export const config = {
//   api: {
//     // bodyParser: false, // Default for non-POST/PUT/PATCH
//   },
// };

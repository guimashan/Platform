// api/generate-short-url.js
import { randomBytes } from 'crypto';
const admin = require('firebase-admin');

// 檢查是否已經初始化
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// --- 生成唯一短碼的函數 ---
function generateUniqueShortCode(length = 6) {
  let code;
  let tries = 0;
  const maxTries = 10;

  do {
    code = randomBytes(Math.ceil(length * 0.75))
               .toString('base64')
               .replace(/\+/g, '')
               .replace(/\//g, '')
               .replace(/=/g, '')
               .substring(0, length);
    tries++;
  } while (isShortCodeExists(code) && tries < maxTries);

  if (tries >= maxTries) {
    throw new Error('生成唯一短碼失敗，請稍後再試');
  }

  return code;
}

// --- 檢查短碼是否存在 (非同步查詢 Firestore) ---
async function isShortCodeExists(code) {
  const docRef = db.collection('urls').doc(code);
  const doc = await docRef.get();
  return doc.exists;
}

// --- 儲存短碼與長網址的對應關係 (寫入 Firestore) ---
async function saveUrlMapping(code, longUrl) {
  await db.collection('urls').doc(code).set({
    longUrl: longUrl,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// --- 主要的 API 處理函數 ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { longUrl } = req.body;

  if (!longUrl) {
    return res.status(400).json({ error: '缺少 longUrl' });
  }

  try {
    new URL(longUrl);

    let shortCode;
    let tries = 0;
    const maxTries = 20; // 增加嘗試次數以應對競爭條件
    do {
      shortCode = generateUniqueShortCode(6);
      const exists = await isShortCodeExists(shortCode);
      if (exists) tries++;
    } while (exists && tries < maxTries);

    if (tries >= maxTries) {
      return res.status(500).json({ error: '產生唯一短碼失敗，請稍後再試' });
    }

    await saveUrlMapping(shortCode, longUrl);

    const shortUrl = `https://go.guimashan.org.tw/${shortCode}`;

    res.status(200).json({ shortUrl, shortCode });

  } catch (error) {
    console.error('API Error:', error);
    if (error.code === 'ERR_INVALID_URL') {
      return res.status(400).json({ error: '無效的 URL 格式' });
    }
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

// api/generate-short-url.js
// Vercel API Route for generating short URLs

import { randomBytes } from 'crypto';

// --- 模擬資料庫 (僅供開發測試，實際部署需替換為真實資料庫) ---
// 注意：這只在 Vercel 函數執行期間有效，不適合生產環境
let urlDatabase = new Map();

// --- 模擬資料庫操作函數 (實際應使用真實資料庫函數) ---
// 檢查短碼是否存在
async function isShortCodeExists(code) {
  // 這裡模擬檢查，實際應查詢真實資料庫
  return urlDatabase.has(code);
}

// 儲存短碼與長網址的對應關係
async function saveUrlMapping(code, longUrl) {
  // 這裡模擬儲存，實際應寫入真實資料庫
  urlDatabase.set(code, { longUrl, createdAt: new Date().toISOString() });
}

// --- 生成唯一短碼的函數 ---
function generateUniqueShortCode(length = 6) {
  let code;
  let tries = 0;
  const maxTries = 10; // 防止無限循環

  do {
    // 使用 randomBytes 生成隨機字串，並轉換為 URL 安全的 base64，再去除特殊符號
    code = randomBytes(Math.ceil(length * 0.75)) // 大致對應所需的字元數
               .toString('base64')
               .replace(/\+/g, '') // 移除 +
               .replace(/\//g, '') // 移除 /
               .replace(/=/g, '') // 移除 =
               .substring(0, length); // 確保長度
    tries++;
  } while (isShortCodeExists(code) && tries < maxTries); // 檢查是否已存在

  if (tries >= maxTries) {
    throw new Error('生成唯一短碼失敗，請稍後再試');
  }

  return code;
}

// --- 主要的 API 處理函數 ---
export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { longUrl } = req.body;

  // 驗證輸入
  if (!longUrl) {
    return res.status(400).json({ error: '缺少 longUrl' });
  }

  try {
    // 基本的 URL 格式驗證 (可選，但建議)
    new URL(longUrl);

    // 生成唯一短碼
    const shortCode = generateUniqueShortCode(6); // 生成 6 位元的短碼

    // 儲存到模擬資料庫 (實際應儲存到真實資料庫)
    await saveUrlMapping(shortCode, longUrl);

    // 構建完整的短網址
    // 注意：這裡使用你的自訂網域 go.guimashan.org.tw
    const shortUrl = `https://go.guimashan.org.tw/${shortCode}`;

    // 回傳成功的 JSON
    res.status(200).json({ shortUrl, shortCode });

  } catch (error) {
    console.error('API Error:', error);
    if (error.code === 'ERR_INVALID_URL') {
      return res.status(400).json({ error: '無效的 URL 格式' });
    }
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
}

// 設定 Vercel 函數的選項 (可選)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // 限制請求體大小
    },
  },
};

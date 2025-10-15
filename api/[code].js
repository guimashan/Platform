// api/[code].js
// Vercel API Route for redirecting short URLs to long URLs

// --- 模擬資料庫查詢函數 (實際應使用真實資料庫函數) ---
// 獲取長網址
async function getLongUrl(code) {
  // 這裡模擬查詢，實際應從真實資料庫查詢
  // 注意：這需要與 generate-short-url.js 中的模擬資料庫共享狀態
  // 在實際應用中，這裡會是真實的資料庫查詢邏輯
  const urlDatabase = global.urlDatabase || new Map(); // 模擬共享資料庫 (僅測試用)
  const entry = urlDatabase.get(code);
  return entry ? entry.longUrl : null;
}

// --- 主要的 API 處理函數 ---
export default async function handler(req, res) {
  // 只允許 GET 請求 (用於跳轉)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 從動態路由中取得短碼
  const { code } = req.query;

  // 驗證短碼是否存在
  if (!code) {
    return res.status(400).json({ error: '缺少短碼' });
  }

  try {
    // 從模擬資料庫查詢對應的長網址 (實際應查詢真實資料庫)
    const longUrl = await getLongUrl(code);

    if (!longUrl) {
      // 如果找不到對應的長網址，返回 404
      return res.status(404).json({ error: '短網址不存在' });
    }

    // 設定 HTTP 307 重定向狀態碼 (臨時重定向，保留原始請求方法)
    // 或者使用 302 (Found) 也是常見的選擇
    res.redirect(307, longUrl);

  } catch (error) {
    console.error('Redirect API Error:', error);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
}

// 設定 Vercel 函數的選項 (可選)
export const config = {
  api: {
    // bodyParser: false, // GET 請求通常不需要解析 body
  },
};

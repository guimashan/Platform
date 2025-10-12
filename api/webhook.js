// 這是一個簡單的 LINE Webhook，用來找出你的 User ID

export default async function handler(req, res) {
  // 只接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  try {
    const events = req.body.events;
    
    // 將收到的訊息記錄下來
    console.log('收到 LINE 訊息:', JSON.stringify(events, null, 2));
    
    // 如果有事件
    if (events && events.length > 0) {
      const event = events[0];
      const userId = event.source.userId;
      
      // 回傳 User ID（這會顯示在 Vercel 的 logs）
      console.log('User ID:', userId);
    }
    
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook 錯誤:', error);
    return res.status(500).send('Error');
  }
}

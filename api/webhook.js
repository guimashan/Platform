export default async function handler(req, res) {
  // 只接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  try {
    const events = req.body.events;
    
    // 如果有事件
    if (events && events.length > 0) {
      const event = events[0];
      const userId = event.source.userId;
      
      // 記錄 User ID 到 console（可在 Vercel Logs 查看）
      console.log('=== LINE USER ID ===');
      console.log(userId);
      console.log('===================');
      
      // 回傳訊息給使用者
      if (event.type === 'message') {
        await replyMessage(event.replyToken, userId);
      }
    }
    
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook 錯誤:', error);
    return res.status(500).send('Error');
  }
}

// 回覆訊息函數
async function replyMessage(replyToken, userId) {
  const LINE_CHANNEL_ACCESS_TOKEN = 'ddMO/IzXSGjJOnYeoXiabvz94uITfQiF0qaiBRd3VUAY1f9d/ae+WGnNDdC6FnM2DQf0sAqh1H50OAK7pqTukADagJKz9EbT/yNlXwdR/Xxl72pUym9R7XiRPF5WidDi0foKTR5cUGZ/k92MVIt30AdB04t89/1O/w1cDnyilFU=';
  
  try {
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{
          type: 'text',
          text: `✅ 您的 LINE User ID:\n\n${userId}\n\n請將此 ID 提供給系統管理員，用於設定最高管理員權限。`
        }]
      })
    });
    
    console.log('已回覆 User ID 給使用者');
  } catch (error) {
    console.error('回覆訊息失敗:', error);
  }
}

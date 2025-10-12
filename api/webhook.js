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
      
      // 重點：把 User ID 記錄到 console
      console.log('=== LINE USER ID ===');
      console.log(userId);
      console.log('===================');
      
      // 回傳訊息給使用者（顯示他的 User ID）
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

// 回覆訊息
async function replyMessage(replyToken, userId) {
  const LINE_CHANNEL_ACCESS_TOKEN = 'hJHXtSJaf4Kl2xcBIJwbUm3P3X+YiU345CYhdMVkCxe4L0r5QtiKbQOMK6UJowFSDQf0sAqh1H50OAK7pqTukADagJKz9EbT/yNlXwdR/XwDc+Et8MaUgYhNXlIQ8z3Lwzcw9h2WlPYPuJj6NFXZ5AdB04t89/1O/w1cDnyilFU='; // 稍後填入
  
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
          text: `✅ 您的 LINE User ID:\n\n${userId}\n\n請將此 ID 提供給系統管理員`
        }]
      })
    });
  } catch (error) {
    console.error('回覆訊息失敗:', error);
  }
}

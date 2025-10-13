// ═══════════════════════════════════════════════════════════════
// LINE Bot Webhook 處理程式（修正編碼問題版本）
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // 設定 CORS 和編碼
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // 只接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(200).json({ message: 'OK' });
  }

  try {
    // 取得環境變數
    const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      console.error('❌ LINE_CHANNEL_ACCESS_TOKEN 未設定');
      return res.status(500).json({ error: 'Token not configured' });
    }

    // 取得 LINE 傳來的事件
    const events = req.body?.events || [];
    
    console.log(`📩 收到 ${events.length} 個事件`);
    
    // 處理每一個事件
    for (const event of events) {
      await handleEvent(event, LINE_CHANNEL_ACCESS_TOKEN);
    }

    // 回應 LINE 伺服器
    return res.status(200).json({ message: 'OK' });
    
  } catch (error) {
    console.error('❌ Webhook Error:', error.message);
    console.error('錯誤詳情:', error);
    return res.status(200).json({ message: 'OK' }); // 仍然回傳 200 避免 LINE 重試
  }
}

// 處理單一事件
async function handleEvent(event, accessToken) {
  // 只處理文字訊息
  if (event.type !== 'message' || event.message?.type !== 'text') {
    return;
  }

  const userMessage = event.message.text.trim();
  const replyToken = event.replyToken;

  console.log(`💬 收到訊息: "${userMessage}"`);

  // 根據關鍵字決定回應內容
  let replyMessage = getReplyMessage(userMessage);

  // 如果有回應訊息，就傳送
  if (replyMessage) {
    await replyToUser(replyToken, replyMessage, accessToken);
  }
}

// 根據關鍵字取得回應訊息
function getReplyMessage(userMessage) {
  // ========== 註冊類關鍵字 ==========
  if (userMessage === '奉香註冊') {
    return '✅ 您已註冊為奉香的工作人員！\n請掃描 QR Code 進行奉香簽到。\n\n網址：https://guimashen.vercel.app/checkin/';
  }
  if (userMessage === '奉香管理註冊') {
    return '✅ 您已註冊為奉香的管理者！\n請點選以下網址進行管理。\n\n網址：https://guimashen.vercel.app/checkin/manage/';
  }
  if (userMessage === '奉香系統註冊') {
    return '✅ 您已註冊為奉香的系統管理員！\n請點選以下網址進行管理。\n\n網址：https://guimashen.vercel.app/checkin/manage/';
  }

  // ========== 使用類關鍵字 ==========
  if (userMessage === '奉香簽到') {
    return '📍 歡迎龜馬山的同事們！\n請掃描巡邏點的 QR Code 進行奉香簽到。\n\n網址：https://guimashen.vercel.app/checkin/';
  }
  if (userMessage === '奉香管理') {
    return '📊 歡迎奉香的管理者！\n請點選以下網址查看統計、輸出報表。\n\n🔐 管理後台：\nhttps://guimashen.vercel.app/checkin/manage/';
  }
  if (userMessage === '奉香系統') {
    return '🔧 歡迎奉香的系統管理員！\n請點選以下網址進行系統管理。\n\n🔐 系統管理：\nhttps://guimashen.vercel.app/checkin/manage/';
  }

  // ========== 排班系統 ==========
  if (userMessage === '志工註冊' || userMessage === '工作註冊') {
    return '✅ 您已註冊排班系統！\n請點選以下網址進行排班。\n\n網址：https://guimashen.vercel.app/schedule/';
  }
  if (userMessage === '志工排班' || userMessage === '工作排班') {
    return '📅 歡迎龜馬山的夥伴們！\n請點選以下網址進行排班。\n\n網址：https://guimashen.vercel.app/schedule/';
  }
  if (userMessage === '排班管理') {
    return '📊 歡迎排班網站的管理者！\n請點選以下網址查看統計、輸出報表。\n\n🔐 管理後台：\nhttps://guimashen.vercel.app/schedule/manage/';
  }
  if (userMessage === '排班系統') {
    return '🔧 歡迎排班網站的系統管理者！\n請點選以下網址查看統計、輸出報表。\n\n🔐 系統管理：\nhttps://guimashen.vercel.app/schedule/manage/';
  }

  // ========== 神服服務 ==========
  if (userMessage === '神服註冊') {
    return '✅ 您已註冊為龜馬山的神服服務！\n\n網址：https://guimashen.vercel.app/service/';
  }
  if (userMessage === '神服服務') {
    return '🙏 神服服務網址：\nhttps://guimashen.vercel.app/service/';
  }
  if (userMessage === '神服管理') {
    return '📊 歡迎龜馬山的神服服務管理者！\n請點選以下網址查看統計、輸出報表。\n\n🔐 管理後台：\nhttps://guimashen.vercel.app/service/manage/';
  }
  if (userMessage === '神服系統') {
    return '🔧 歡迎龜馬山的神服服務系統管理者！\n請點選以下網址查看統計、輸出報表。\n\n🔐 系統管理：\nhttps://guimashen.vercel.app/service/manage/';
  }

  // ========== 退場類關鍵字 ==========
  if (userMessage === '奉香退場') {
    return '✅ 您的奉香帳號已標記為離職，感謝您過去的服務！';
  }
  if (userMessage === '排班退場') {
    return '✅ 您的排班帳號已標記為離職，感謝您過去的服務！';
  }
  if (userMessage === '神服退場') {
    return '✅ 您的神服服務帳號已標記為刪除，感謝您！';
  }

  // 沒有符合的關鍵字，不回應
  return null;
}

// 傳送回應訊息給使用者
async function replyToUser(replyToken, message, accessToken) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken.trim()}` // 確保 trim 掉空白
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LINE API Error:', response.status, errorText);
    } else {
      console.log('✅ 訊息已送出');
    }
  } catch (error) {
    console.error('❌ 傳送訊息失敗:', error.message);
  }
}

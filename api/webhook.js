// ═══════════════════════════════════════════════════════════════
// LINE Bot Webhook 處理程式
// 用途：接收使用者訊息，回應關鍵字
// ═══════════════════════════════════════════════════════════════

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '你的 LINE Channel Access Token';
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '315aab680603fd2675ad15c839af00c2';

// Vercel Serverless Function 進入點
export default async function handler(req, res) {
  // 只接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 取得 LINE 傳來的事件
    const events = req.body.events || [];
    
    // 處理每一個事件
    for (const event of events) {
      await handleEvent(event);
    }

    // 回應 LINE 伺服器
    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 處理單一事件
async function handleEvent(event) {
  // 只處理文字訊息
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  const userMessage = event.message.text.trim();
  const replyToken = event.replyToken;

  // 根據關鍵字回應
  let replyMessage = '';

  // ========== 註冊類關鍵字 ==========
  if (userMessage === '奉香註冊') {
    replyMessage = '✅ 您已註冊為奉香的工作人員！\n請掃描 QR Code 進行奉香簽到。\n\n網址：https://guimashen.vercel.app/checkin/';
  }
  else if (userMessage === '奉香管理註冊') {
    replyMessage = '✅ 您已註冊為奉香的管理者！\n請點選以下網址進行管理。\n\n網址：https://guimashen.vercel.app/checkin/manage/';
  }
  else if (userMessage === '奉香系統註冊') {
    replyMessage = '✅ 您已註冊為奉香的系統管理員！\n請點選以下網址進行管理。\n\n網址：https://guimashen.vercel.app/checkin/manage/';
  }
  else if (userMessage === '志工註冊') {
    replyMessage = '✅ 您已註冊排班網站的志工！\n請點選以下網址進行排班。\n\n網址：https://guimashen.vercel.app/schedule/';
  }
  else if (userMessage === '工作註冊') {
    replyMessage = '✅ 您已註冊排班網站的工作人員！\n請點選以下網址進行排班。\n\n網址：https://guimashen.vercel.app/schedule/';
  }
  else if (userMessage === '神服註冊') {
    replyMessage = '✅ 您已註冊為龜馬山的神服服務！\n\n網址：https://guimashen.vercel.app/service/';
  }

  // ========== 使用類關鍵字 ==========
  else if (userMessage === '奉香簽到') {
    replyMessage = '📍 歡迎龜馬山的同事們！\n請掃描巡邏點的 QR Code 進行奉香簽到。\n\n網址：https://guimashen.vercel.app/checkin/';
  }
  else if (userMessage === '奉香管理') {
    replyMessage = '📊 歡迎奉香的管理者！\n請點選以下網址查看統計、輸出報表。\n\n🔐 管理後台：\nhttps://guimashen.vercel.app/checkin/manage/';
  }
  else if (userMessage === '奉香系統') {
    replyMessage = '🔧 歡迎奉香的系統管理員！\n請點選以下網址進行系統管理。\n\n🔐 系統管理：\nhttps://guimashen.vercel.app/checkin/manage/';
  }
  else if (userMessage === '志工排班' || userMessage === '工作排班') {
    replyMessage = '📅 歡迎龜馬山的夥伴們！\n請點選以下網址進行排班。\n\n網址：https://guimashen.vercel.app/schedule/';
  }
  else if (userMessage === '排班管理') {
    replyMessage = '📊 歡迎排班網站的管理者！\n請點選以下網址查看統計、輸出報表。\n\n🔐 管理後台：\nhttps://guimashen.vercel.app/schedule/manage/';
  }
  else if (userMessage === '排班系統') {
    replyMessage = '🔧 歡迎排班網站的系統管理者！\n請點選以下網址查看統計、輸出報表。\n\n🔐 系統管理：\nhttps://guimashen.vercel.app/schedule/manage/';
  }
  else if (userMessage === '神服服務') {
    replyMessage = '🙏 神服服務網址：\nhttps://guimashen.vercel.app/service/';
  }
  else if (userMessage === '神服管理') {
    replyMessage = '📊 歡迎龜馬山的神服服務管理者！\n請點選以下網址查看統計、輸出報表。\n\n🔐 管理後台：\nhttps://guimashen.vercel.app/service/manage/';
  }
  else if (userMessage === '神服系統') {
    replyMessage = '🔧 歡迎龜馬山的神服服務系統管理者！\n請點選以下網址查看統計、輸出報表。\n\n🔐 系統管理：\nhttps://guimashen.vercel.app/service/manage/';
  }

  // ========== 退場類關鍵字 ==========
  else if (userMessage === '奉香退場') {
    replyMessage = '✅ 您的奉香帳號已標記為離職，感謝您過去的服務！';
  }
  else if (userMessage === '排班退場') {
    replyMessage = '✅ 您的排班帳號已標記為離職，感謝您過去的服務！';
  }
  else if (userMessage === '神服退場') {
    replyMessage = '✅ 您的神服服務帳號已標記為刪除，感謝您！';
  }

  // 如果有回應訊息，就傳送
  if (replyMessage) {
    await replyToUser(replyToken, replyMessage);
  }
}

// 傳送回應訊息給使用者
async function replyToUser(replyToken, message) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
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
    console.error('LINE API Error:', await response.text());
  }
}

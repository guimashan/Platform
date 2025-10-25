// src/lib/verifyLineIdToken.ts

export interface LineIdTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nonce?: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * 使用 LINE 官方驗證 API 驗證 ID Token
 * 這是 LINE 推薦的方式，能處理所有已知問題（包括缺少 kid header）
 * 
 * @see https://developers.line.biz/en/reference/line-login/#verify-id-token
 */
export async function verifyLineIdToken(
  idToken: string,
  expectedNonce: string,
  expectedAudience: string
): Promise<LineIdTokenPayload> {
  console.log('🔍 使用 LINE 官方 API 驗證 ID Token...');
  console.log('   Expected Audience (Channel ID):', expectedAudience);
  console.log('   Expected Nonce:', expectedNonce);
  console.log('   ID Token (前50字):', idToken.substring(0, 50) + '...');
  
  try {
    // 使用 LINE 官方驗證端點
    console.log('   ➡️  調用 LINE 驗證 API...');
    const verifyParams = new URLSearchParams({
      id_token: idToken,
      client_id: expectedAudience,
    });
    
    if (expectedNonce) {
      verifyParams.append('nonce', expectedNonce);
    }
    
    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyParams.toString(),
    });
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('   ❌ LINE 驗證 API 失敗:', errorText);
      throw new Error(`LINE verify API failed: ${verifyResponse.status} ${errorText}`);
    }
    
    // 安全解析 JSON（處理可能包含控制字符的響應）
    let payload: LineIdTokenPayload;
    try {
      const responseText = await verifyResponse.text();
      // 移除控制字符（但保留空格、換行等必要字符）
      const cleanedText = responseText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      payload = JSON.parse(cleanedText) as LineIdTokenPayload;
    } catch (parseError) {
      console.error('   ❌ JSON 解析失敗:', parseError);
      throw new Error(`Failed to parse LINE API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
    
    console.log('   ✅ LINE 驗證 API 成功');
    console.log('   User ID:', payload.sub);
    console.log('   Email:', payload.email || 'N/A');
    console.log('   Name:', payload.name || 'N/A');
    
    // LINE API 已經驗證了 nonce（如果提供），但我們再次確認
    if (expectedNonce && payload.nonce !== expectedNonce) {
      console.error('   ❌ Nonce 不匹配！');
      console.error('   Expected:', expectedNonce);
      console.error('   Received:', payload.nonce);
      throw new Error('Nonce mismatch - possible replay attack');
    }
    
    console.log('   ✅ 所有驗證通過（包括 nonce）');
    console.log('✅ ID Token 驗證完成');
    return payload;
  } catch (error) {
    console.error('❌ LINE ID Token verification failed:', error);
    console.error('   Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw new Error(`ID token verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

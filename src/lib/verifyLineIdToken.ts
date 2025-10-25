// src/lib/verifyLineIdToken.ts
import { jwtVerify, importJWK, decodeProtectedHeader } from "jose";

const LINE_JWKS_URL = 'https://api.line.me/oauth2/v2.1/certs';

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
 * 完整驗證 LINE ID Token
 * - 驗證簽名（使用 LINE 的公鑰）
 * - 驗證 issuer, audience, expiration
 * - 驗證 nonce（CSRF 防護）
 */
export async function verifyLineIdToken(
  idToken: string,
  expectedNonce: string,
  expectedAudience: string
): Promise<LineIdTokenPayload> {
  console.log('🔍 開始驗證 ID Token...');
  console.log('   Expected Audience (Channel ID):', expectedAudience);
  console.log('   Expected Nonce:', expectedNonce);
  console.log('   ID Token (前50字):', idToken.substring(0, 50) + '...');
  
  try {
    // Step 1: 解碼 JWT header 獲取算法
    console.log('   ➡️  Step 1: 解碼 JWT Header...');
    const header = decodeProtectedHeader(idToken);
    console.log('   完整 Header:', JSON.stringify(header, null, 2));
    console.log('   Algorithm:', header.alg);
    console.log('   Key ID (kid):', header.kid || 'MISSING');
    
    // Step 2: 從 LINE JWKS 獲取所有公鑰
    console.log('   ➡️  Step 2: 獲取 LINE JWKS...');
    const jwksResponse = await fetch(LINE_JWKS_URL);
    const jwks = await jwksResponse.json() as { keys: any[] };
    console.log(`   找到 ${jwks.keys.length} 個密鑰`);
    
    // Step 3: 驗證 JWT 並找到匹配的密鑰
    let payload: any;
    let matchedKid: string | undefined;
    
    if (header.kid) {
      // 有 kid：直接查找匹配的密鑰
      console.log('   ➡️  Step 3a: 使用 kid 查找密鑰...');
      const jwk = jwks.keys.find(key => key.kid === header.kid);
      if (!jwk) {
        throw new Error(`Key with kid ${header.kid} not found in JWKS`);
      }
      console.log('   ✅ 找到匹配的密鑰:', jwk.kid);
      const publicKey = await importJWK(jwk, header.alg as string);
      matchedKid = jwk.kid;
      
      // 驗證 JWT
      const result = await jwtVerify(idToken, publicKey, {
        issuer: 'https://access.line.me',
        audience: expectedAudience,
      });
      payload = result.payload;
    } else {
      // 沒有 kid：嘗試所有密鑰（LINE 的已知問題）
      console.log('   ➡️  Step 3b: 沒有 kid，嘗試所有密鑰...');
      
      let verificationErrors: string[] = [];
      let found = false;
      
      for (const jwk of jwks.keys) {
        // 只嘗試匹配算法的密鑰
        if (jwk.alg && jwk.alg !== header.alg) {
          continue;
        }
        
        try {
          console.log(`   🔑 嘗試密鑰: ${jwk.kid?.substring(0, 16)}...`);
          const testKey = await importJWK(jwk, header.alg as string);
          
          // 嘗試驗證
          const result = await jwtVerify(idToken, testKey, {
            issuer: 'https://access.line.me',
            audience: expectedAudience,
          });
          
          // 成功！
          payload = result.payload;
          matchedKid = jwk.kid;
          console.log(`   ✅ 找到有效密鑰: ${jwk.kid}`);
          found = true;
          break;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          verificationErrors.push(`${jwk.kid}: ${errorMsg}`);
          continue;
        }
      }
      
      if (!found) {
        console.error('   ❌ 所有密鑰都失敗了');
        console.error('   錯誤詳情:', verificationErrors.slice(0, 3));
        throw new Error('No valid key found in JWKS for this token');
      }
    }
    
    console.log('   ✅ JWT 簽名驗證成功');
    console.log('   使用的密鑰:', matchedKid);
    console.log('   Payload:', JSON.stringify(payload, null, 2));

    // 驗證 nonce
    console.log('   ➡️  Step 6: 驗證 Nonce...');
    console.log('   Payload Nonce:', payload.nonce);
    console.log('   Expected Nonce:', expectedNonce);
    
    if (payload.nonce !== expectedNonce) {
      console.error('   ❌ Nonce 不匹配！');
      throw new Error('Nonce mismatch - possible replay attack');
    }
    console.log('   ✅ Nonce 驗證成功');

    console.log('✅ ID Token 驗證完成');
    return payload as LineIdTokenPayload;
  } catch (error) {
    console.error('❌ LINE ID Token verification failed:', error);
    console.error('   Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw new Error(`ID token verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

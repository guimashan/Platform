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
    // Step 1: 解碼 JWT header 獲取 kid 和 alg
    console.log('   ➡️  Step 1: 解碼 JWT Header...');
    const header = decodeProtectedHeader(idToken);
    console.log('   Algorithm:', header.alg);
    console.log('   Key ID:', header.kid);
    
    // Step 2: 從 LINE JWKS 獲取對應的公鑰
    console.log('   ➡️  Step 2: 獲取 LINE JWKS...');
    const jwksResponse = await fetch(LINE_JWKS_URL);
    const jwks = await jwksResponse.json() as { keys: any[] };
    console.log(`   找到 ${jwks.keys.length} 個密鑰`);
    
    // Step 3: 根據 kid 找到對應的 JWK
    console.log('   ➡️  Step 3: 查找匹配的 JWK...');
    const jwk = jwks.keys.find(key => key.kid === header.kid);
    if (!jwk) {
      throw new Error(`Key with kid ${header.kid} not found in JWKS`);
    }
    console.log('   ✅ 找到匹配的密鑰:', {
      kid: jwk.kid,
      kty: jwk.kty,
      alg: jwk.alg,
      use: jwk.use
    });
    
    // Step 4: 導入 JWK 為公鑰
    console.log('   ➡️  Step 4: 導入 JWK...');
    const publicKey = await importJWK(jwk, header.alg as string);
    console.log('   ✅ JWK 導入成功');
    
    // Step 5: 驗證 JWT 簽名
    console.log('   ➡️  Step 5: 驗證 JWT 簽名...');
    const { payload } = await jwtVerify(idToken, publicKey, {
      issuer: 'https://access.line.me',
      audience: expectedAudience,
    });
    console.log('   ✅ JWT 簽名驗證成功');
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

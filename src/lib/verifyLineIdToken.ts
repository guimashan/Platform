// src/lib/verifyLineIdToken.ts
import { jwtVerify, createRemoteJWKSet } from "jose";

const LINE_JWKS_URL = 'https://api.line.me/oauth2/v2.1/certs';

// 快取 JWK Set
const JWKS = createRemoteJWKSet(new URL(LINE_JWKS_URL));

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
    // 使用 LINE 的公鑰驗證 JWT 簽名
    console.log('   ➡️  Step 1: 驗證 JWT 簽名...');
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: 'https://access.line.me',
      audience: expectedAudience,
    });
    console.log('   ✅ JWT 簽名驗證成功');
    console.log('   Payload:', JSON.stringify(payload, null, 2));

    // 驗證 nonce
    console.log('   ➡️  Step 2: 驗證 Nonce...');
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

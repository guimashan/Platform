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
  try {
    // 使用 LINE 的公鑰驗證 JWT 簽名
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: 'https://access.line.me',
      audience: expectedAudience,
    });

    // 驗證 nonce
    if (payload.nonce !== expectedNonce) {
      throw new Error('Nonce mismatch - possible replay attack');
    }

    return payload as LineIdTokenPayload;
  } catch (error) {
    console.error('LINE ID Token verification failed:', error);
    throw new Error(`ID token verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

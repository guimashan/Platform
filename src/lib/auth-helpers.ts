// src/lib/auth-helpers.ts
import { platformAdminAuth, platformAdminDb } from "./admin-platform";

export interface AuthResult {
  uid: string;
  email?: string;
  isSuperAdmin: boolean;
  roles: Record<string, boolean>;
}

export async function verifyAuth(authHeader: string | null): Promise<AuthResult | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decodedToken = await platformAdminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await platformAdminDb().collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return {
        uid,
        email: decodedToken.email,
        isSuperAdmin: false,
        roles: {}
      };
    }

    const userData = userDoc.data();
    
    return {
      uid,
      email: userData?.email || decodedToken.email,
      isSuperAdmin: userData?.isSuperAdmin || false,
      roles: userData?.roles || {}
    };
  } catch (err) {
    console.error("[verifyAuth] ERROR:", err);
    return null;
  }
}

export function hasCheckinAdmin(auth: AuthResult): boolean {
  return auth.isSuperAdmin || auth.roles.checkin_admin === true;
}

export function hasScheduleAdmin(auth: AuthResult): boolean {
  return auth.isSuperAdmin || auth.roles.schedule_admin === true;
}

export function hasServiceAdmin(auth: AuthResult): boolean {
  return auth.isSuperAdmin || auth.roles.service_admin === true;
}

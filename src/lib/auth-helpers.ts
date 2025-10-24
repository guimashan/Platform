import { platformAdminAuth, platformAdminDb } from "./admin-platform";
import { UserRole, PermissionCheck, GpsCoordinates } from "@/types";

/**
 * 驗證 Firebase ID Token 並返回使用者資料
 */
export async function verifyAuth(idToken: string) {
  try {
    const decodedToken = await platformAdminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await platformAdminDb()
      .collection("users")
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      throw new Error("使用者不存在");
    }

    const userData = userDoc.data();
    return {
      uid,
      userData,
    };
  } catch (error: any) {
    throw new Error(`認證失敗: ${error.message}`);
  }
}

/**
 * 檢查使用者角色
 */
export function getUserRole(userData: any): UserRole {
  // 優先檢查 isSuperAdmin
  if (userData?.isSuperAdmin) {
    return "superadmin";
  }
  
  // 使用新的 role 欄位
  if (userData?.role) {
    return userData.role as UserRole;
  }
  
  // 預設為 user
  return "user";
}

/**
 * 檢查是否為 SuperAdmin
 */
export function isSuperAdmin(userData: any): boolean {
  return userData?.isSuperAdmin === true || getUserRole(userData) === "superadmin";
}

/**
 * 檢查是否為 Admin 或以上
 */
export function isAdmin(userData: any): boolean {
  const role = getUserRole(userData);
  return role === "admin" || role === "superadmin";
}

/**
 * 檢查是否為 PowerUser 或以上
 */
export function isPowerUser(userData: any): boolean {
  const role = getUserRole(userData);
  return role === "poweruser" || role === "admin" || role === "superadmin";
}

/**
 * 檢查簽到權限
 * - user: 需要 GPS 驗證
 * - poweruser/admin/superadmin: 免 GPS 驗證
 */
export function checkCheckinPermission(userData: any, hasGps: boolean): PermissionCheck {
  const role = getUserRole(userData);
  
  if (role === "user") {
    if (!hasGps) {
      return {
        allowed: false,
        reason: "user 角色需要提供 GPS 位置",
        role,
      };
    }
    return { allowed: true, role };
  }
  
  // poweruser, admin, superadmin 都可以簽到（免 GPS）
  if (["poweruser", "admin", "superadmin"].includes(role)) {
    return { allowed: true, role };
  }
  
  return {
    allowed: false,
    reason: "無簽到權限",
    role,
  };
}

/**
 * 檢查查看記錄權限
 * - poweruser/admin/superadmin: 可以查看
 */
export function checkViewRecordsPermission(userData: any): PermissionCheck {
  const role = getUserRole(userData);
  
  if (["poweruser", "admin", "superadmin"].includes(role)) {
    return { allowed: true, role };
  }
  
  return {
    allowed: false,
    reason: "需要 poweruser 或以上權限",
    role,
  };
}

/**
 * 檢查管理巡邏點權限
 * - admin/superadmin: 可以管理
 */
export function checkManagePatrolsPermission(userData: any): PermissionCheck {
  const role = getUserRole(userData);
  
  if (["admin", "superadmin"].includes(role)) {
    return { allowed: true, role };
  }
  
  return {
    allowed: false,
    reason: "需要 admin 或以上權限",
    role,
  };
}

/**
 * 檢查設定角色權限
 * - 設定 user/poweruser/admin: 需要 admin 權限
 * - 設定 superadmin: 需要 superadmin 權限
 */
export function checkSetRolePermission(
  userData: any,
  targetRole: UserRole
): PermissionCheck {
  const role = getUserRole(userData);
  
  if (targetRole === "superadmin") {
    if (role === "superadmin") {
      return { allowed: true, role };
    }
    return {
      allowed: false,
      reason: "只有 superadmin 可以設定 superadmin 角色",
      role,
    };
  }
  
  if (["admin", "superadmin"].includes(role)) {
    return { allowed: true, role };
  }
  
  return {
    allowed: false,
    reason: "需要 admin 或以上權限",
    role,
  };
}

/**
 * 計算兩個 GPS 座標之間的距離（單位：公尺）
 * 使用 Haversine 公式
 */
export function calculateDistance(
  point1: GpsCoordinates,
  point2: GpsCoordinates
): number {
  const R = 6371e3; // 地球半徑（公尺）
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 距離（公尺）
}

/**
 * 驗證 GPS 位置是否在巡邏點範圍內
 */
export function verifyGpsLocation(
  userLocation: GpsCoordinates,
  patrolLocation: GpsCoordinates,
  tolerance: number
): { valid: boolean; distance: number } {
  const distance = calculateDistance(userLocation, patrolLocation);
  return {
    valid: distance <= tolerance,
    distance: Math.round(distance),
  };
}

/**
 * 檢查是否為簽到系統管理員
 */
export function hasCheckinAdmin(auth: { uid: string; userData: any }): boolean {
  if (!auth || !auth.userData) {
    return false;
  }
  
  // 檢查是否為 SuperAdmin
  if (isSuperAdmin(auth.userData)) {
    return true;
  }
  
  // 檢查新架構的 checkin_role
  if (auth.userData.checkin_role === "admin") {
    return true;
  }
  
  // 檢查舊架構的 roles.checkin_admin
  if (auth.userData.roles?.checkin_admin === true) {
    return true;
  }
  
  return false;
}

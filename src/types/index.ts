import { Timestamp } from "firebase/firestore";

// 使用者角色定義
export type UserRole = "user" | "poweruser" | "admin" | "superadmin";

// 使用者文件結構
export interface UserDoc {
  displayName: string;
  pictureUrl?: string;
  lineUserId?: string;
  email?: string;
  hasPassword?: boolean;
  
  // 平台層角色（保留舊欄位以便向後相容）
  role?: UserRole;
  
  // 業務層角色（新架構）
  checkin_role?: UserRole;
  schedule_role?: UserRole;
  service_role?: UserRole;
  
  // 系統管理權限（舊欄位，保留向後相容）
  roles?: {
    checkin_admin?: boolean;
    schedule_admin?: boolean;
    service_admin?: boolean;
  };
  
  isSuperAdmin?: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

// 巡邏點文件結構（含 GPS）
export interface PatrolDoc {
  id: string;
  name: string;
  qr: string;
  
  // GPS 座標
  lat: number;
  lng: number;
  tolerance: number; // 容許誤差（公尺）
  
  active: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// 簽到記錄結構
export interface CheckinDoc {
  id: string;
  uid: string;
  patrolId: string;
  patrolName: string;
  
  // GPS 驗證資訊
  userLat?: number;
  userLng?: number;
  distance?: number; // 實際距離（公尺）
  gpsVerified: boolean; // 是否通過 GPS 驗證
  
  ts: Timestamp;
  meta?: {
    ua?: string;
    ip?: string;
  };
}

// GPS 座標介面
export interface GpsCoordinates {
  lat: number;
  lng: number;
}

// 簽到請求介面
export interface CheckinRequest {
  idToken: string;
  qrCode: string;
  userLat?: number;
  userLng?: number;
}

// 權限檢查結果
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  role: UserRole;
}

// 類型別名（向後相容）
export type Checkin = CheckinDoc;
export type Patrol = PatrolDoc;

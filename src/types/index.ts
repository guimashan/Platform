// 共用型別定義

export type UserRole = 'user' | 'poweruser' | 'admin' | 'superadmin';

export interface UserDoc {
  displayName: string;
  pictureUrl?: string;
  lineUserId?: string;
  roles: Record<string, boolean>;
  isSuperAdmin?: boolean;
  createdAt: number;
  lastLoginAt: number;
}

export interface Patrol {
  id: string;
  name: string;
  qr: string;
  active: boolean;
  createdAt: number;
}

export interface Checkin {
  id: string;
  uid: string;
  patrolId: string;
  ts: number;
  meta?: {
    ua?: string;
    ip?: string;
  };
}

export interface ServiceRequest {
  id: string;
  uid: string;
  serviceType: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: number;
  updatedAt: number;
  description?: string;
}

export interface Schedule {
  id: string;
  uid: string;
  date: string;
  shift: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  createdAt: number;
}

import { z } from "zod";

// ==================== 使用者資料模型 ====================
export const userSchema = z.object({
  id: z.string(), // LINE User ID
  displayName: z.string(),
  pictureUrl: z.string().optional(),
  email: z.string().email().optional(),
  createdAt: z.string(), // ISO timestamp
});

export type User = z.infer<typeof userSchema>;

export const insertUserSchema = userSchema.omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

// ==================== 簽到記錄資料模型 ====================
export const checkinSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  timestamp: z.string(), // ISO timestamp
  location: z.string().optional(),
  type: z.enum(['volunteer', 'visitor', 'member']).default('visitor'),
  notes: z.string().optional(),
});

export type CheckIn = z.infer<typeof checkinSchema>;

export const insertCheckinSchema = checkinSchema.omit({ id: true, timestamp: true });
export type InsertCheckIn = z.infer<typeof insertCheckinSchema>;

export const updateCheckinSchema = checkinSchema.omit({
  id: true,
  timestamp: true,
}).partial();
export type UpdateCheckIn = z.infer<typeof updateCheckinSchema>;

// ==================== 服務申請資料模型 ====================
export const serviceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  serviceType: z.enum(['prayer', 'donation', 'ceremony', 'consultation', 'other']),
  title: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'approved', 'completed', 'cancelled']).default('pending'),
  createdAt: z.string(), // ISO timestamp
  updatedAt: z.string(), // ISO timestamp
});

export type Service = z.infer<typeof serviceSchema>;

export const insertServiceSchema = serviceSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  status: true 
});
export type InsertService = z.infer<typeof insertServiceSchema>;

export const updateServiceSchema = serviceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();
export type UpdateService = z.infer<typeof updateServiceSchema>;

// ==================== 排班資料模型 ====================
export const scheduleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  date: z.string(), // YYYY-MM-DD
  shift: z.enum(['morning', 'afternoon', 'evening', 'night']),
  role: z.string().optional(), // 職務角色
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).default('scheduled'),
  notes: z.string().optional(),
  createdAt: z.string(), // ISO timestamp
});

export type Schedule = z.infer<typeof scheduleSchema>;

export const insertScheduleSchema = scheduleSchema.omit({ 
  id: true, 
  createdAt: true,
  status: true 
});
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export const updateScheduleSchema = scheduleSchema.omit({
  id: true,
  createdAt: true,
}).partial();
export type UpdateSchedule = z.infer<typeof updateScheduleSchema>;

// ==================== LINE 認證相關 ====================
export const lineAuthPayloadSchema = z.object({
  idToken: z.string(),
});

export type LineAuthPayload = z.infer<typeof lineAuthPayloadSchema>;

export const lineAuthResponseSchema = z.object({
  ok: z.boolean(),
  customToken: z.string().optional(),
  userId: z.string().optional(),
  error: z.string().optional(),
});

export type LineAuthResponse = z.infer<typeof lineAuthResponseSchema>;

import { randomUUID } from "crypto";
import type { 
  User, InsertUser, 
  CheckIn, InsertCheckIn, UpdateCheckIn,
  Service, InsertService, UpdateService,
  Schedule, InsertSchedule, UpdateSchedule 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // CheckIn methods
  getCheckins(): Promise<CheckIn[]>;
  getCheckin(id: string): Promise<CheckIn | undefined>;
  createCheckin(checkin: InsertCheckIn): Promise<CheckIn>;
  updateCheckin(id: string, data: UpdateCheckIn): Promise<CheckIn | undefined>;
  deleteCheckin(id: string): Promise<boolean>;

  // Service methods
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, data: UpdateService): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;

  // Schedule methods
  getSchedules(): Promise<Schedule[]>;
  getSchedule(id: string): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, data: UpdateSchedule): Promise<Schedule | undefined>;
  deleteSchedule(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private checkins: Map<string, CheckIn>;
  private services: Map<string, Service>;
  private schedules: Map<string, Schedule>;

  constructor() {
    this.users = new Map();
    this.checkins = new Map();
    this.services = new Map();
    this.schedules = new Map();
  }

  // ==================== User Methods ====================
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.displayName === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      createdAt: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // ==================== CheckIn Methods ====================
  async getCheckins(): Promise<CheckIn[]> {
    return Array.from(this.checkins.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getCheckin(id: string): Promise<CheckIn | undefined> {
    return this.checkins.get(id);
  }

  async createCheckin(insertCheckin: InsertCheckIn): Promise<CheckIn> {
    const id = randomUUID();
    const checkin: CheckIn = {
      ...insertCheckin,
      id,
      timestamp: new Date().toISOString(),
      userId: insertCheckin.userId || `guest-${id.slice(0, 8)}`,
    };
    this.checkins.set(id, checkin);
    return checkin;
  }

  async updateCheckin(id: string, data: UpdateCheckIn): Promise<CheckIn | undefined> {
    const existing = this.checkins.get(id);
    if (!existing) return undefined;

    const updated: CheckIn = {
      ...existing,
      ...data,
      id: existing.id,
      timestamp: existing.timestamp,
    };
    this.checkins.set(id, updated);
    return updated;
  }

  async deleteCheckin(id: string): Promise<boolean> {
    return this.checkins.delete(id);
  }

  // ==================== Service Methods ====================
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const service: Service = {
      ...insertService,
      id,
      status: "pending",
      userId: insertService.userId || `guest-${id.slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: string, data: UpdateService): Promise<Service | undefined> {
    const existing = this.services.get(id);
    if (!existing) return undefined;

    const updated: Service = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.services.set(id, updated);
    return updated;
  }

  async deleteService(id: string): Promise<boolean> {
    return this.services.delete(id);
  }

  // ==================== Schedule Methods ====================
  async getSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = randomUUID();
    const schedule: Schedule = {
      ...insertSchedule,
      id,
      status: "scheduled",
      userId: insertSchedule.userId || `guest-${id.slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: string, data: UpdateSchedule): Promise<Schedule | undefined> {
    const existing = this.schedules.get(id);
    if (!existing) return undefined;

    const updated: Schedule = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    this.schedules.set(id, updated);
    return updated;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    return this.schedules.delete(id);
  }
}

export const storage = new MemStorage();

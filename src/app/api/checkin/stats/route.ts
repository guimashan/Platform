import { NextRequest, NextResponse } from "next/server";
import { checkinAdminDb } from "@/lib/admin-checkin";
import { platformAdminDb } from "@/lib/admin-platform";
import { verifyAuth, hasCheckinAdmin } from "@/lib/auth-helpers";
import type { Checkin } from "@/types";

export const dynamic = "force-dynamic";

interface CheckinWithDate extends Omit<Checkin, 'ts'> {
  ts: Date;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const auth = await verifyAuth(authHeader);
    
    if (!auth) {
      return NextResponse.json(
        { error: "未授權：無效的 Token" },
        { status: 401 }
      );
    }

    if (!hasCheckinAdmin(auth)) {
      return NextResponse.json(
        { error: "權限不足：需要管理員權限" },
        { status: 403 }
      );
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const checkinsRef = checkinAdminDb().collection("checkins");

    const monthCheckinsSnapshot = await checkinsRef
      .where("ts", ">=", lastMonthStart.getTime())
      .get();

    const checkins: CheckinWithDate[] = monthCheckinsSnapshot.docs.map((doc) => {
      const data = doc.data() as Checkin;
      const timestamp = typeof data.ts === 'number' 
        ? new Date(data.ts) 
        : data.ts?.toDate ? data.ts.toDate() : new Date();
      
      return {
        id: doc.id,
        uid: data.uid,
        patrolId: data.patrolId,
        patrolName: data.patrolName || '',
        gpsVerified: data.gpsVerified || false,
        userLat: data.userLat,
        userLng: data.userLng,
        distance: data.distance,
        meta: data.meta,
        ts: timestamp,
      };
    });

    const [allUsers, allPoints] = await Promise.all([
      platformAdminDb().collection("users").get(),
      checkinAdminDb().collection("points").where("active", "==", true).get(),
    ]);

    const todayCheckins = checkins.filter((c) => c.ts >= todayStart);
    const weekCheckins = checkins.filter((c) => c.ts >= weekStart);
    const monthCheckins = checkins.filter((c) => c.ts >= monthStart);

    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayCheckins = checkins.filter(
      (c) => c.ts >= yesterdayStart && c.ts < todayStart
    );

    const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekCheckins = checkins.filter(
      (c) => c.ts >= lastWeekStart && c.ts < weekStart
    );

    const lastMonthCheckins = checkins.filter(
      (c) => c.ts >= lastMonthStart && c.ts < monthStart
    );

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const uniqueUsers = new Set(checkins.map((c) => c.uid));
    const activeUsersToday = new Set(todayCheckins.map((c) => c.uid));

    const trendDays = 7;
    const trendData = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayCheckins = checkins.filter((c) => c.ts >= dayStart && c.ts < dayEnd);
      trendData.push({
        date: dayStart.toISOString().split("T")[0],
        count: dayCheckins.length,
      });
    }

    const patrolDistribution: Record<string, number> = {};
    const pointsMap = new Map();
    allPoints.docs.forEach((doc) => {
      const data = doc.data();
      pointsMap.set(doc.id, data.name);
      patrolDistribution[data.name] = 0;
    });

    checkins.forEach((c) => {
      const pointName = pointsMap.get(c.patrolId) || "未知";
      if (patrolDistribution[pointName] !== undefined) {
        patrolDistribution[pointName]++;
      }
    });

    const timeDistribution = {
      "0-6": 0,
      "6-12": 0,
      "12-18": 0,
      "18-24": 0,
    };

    checkins.forEach((c) => {
      const hour = c.ts.getHours();
      if (hour >= 0 && hour < 6) timeDistribution["0-6"]++;
      else if (hour >= 6 && hour < 12) timeDistribution["6-12"]++;
      else if (hour >= 12 && hour < 18) timeDistribution["12-18"]++;
      else timeDistribution["18-24"]++;
    });

    const recentCheckins = checkins
      .sort((a, b) => b.ts.getTime() - a.ts.getTime())
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        uid: c.uid,
        patrolId: c.patrolId,
        patrolName: pointsMap.get(c.patrolId) || "未知",
        timestamp: c.ts.toISOString(),
      }));

    return NextResponse.json({
      summary: {
        today: {
          count: todayCheckins.length,
          trend: calculateTrend(todayCheckins.length, yesterdayCheckins.length),
        },
        week: {
          count: weekCheckins.length,
          trend: calculateTrend(weekCheckins.length, lastWeekCheckins.length),
        },
        month: {
          count: monthCheckins.length,
          trend: calculateTrend(monthCheckins.length, lastMonthCheckins.length),
        },
        activeUsers: {
          total: uniqueUsers.size,
          today: activeUsersToday.size,
        },
      },
      trend: trendData,
      patrolDistribution,
      timeDistribution,
      recentCheckins,
    });
  } catch (error: any) {
    console.error("統計 API 錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤", details: error.message },
      { status: 500 }
    );
  }
}

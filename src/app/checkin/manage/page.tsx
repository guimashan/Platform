"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { platformAuth } from "@/lib/firebase-platform";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  MapPin, 
  LogOut, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function CheckinManagePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    const unsubscribe = platformAuth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/admin/login");
      } else {
        setUser(currentUser);
        fetchStats(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchStats = async (currentUser: any) => {
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/checkin/stats", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("載入統計數據錯誤:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await platformAuth.signOut();
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  const patrolColors = ["#ea580c", "#0ea5e9", "#22c55e"];
  const patrolDistData = stats?.patrolDistribution
    ? Object.entries(stats.patrolDistribution).map(([name, value], index) => ({
        name,
        value: value as number,
        color: patrolColors[index % patrolColors.length],
      }))
    : [];

  const timeDistData = stats?.timeDistribution
    ? Object.entries(stats.timeDistribution).map(([name, value]) => ({
        name,
        簽到次數: value,
      }))
    : [];

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600";
    if (trend < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
              奉香簽到管理後台
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              登入為：{user?.email}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            登出
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                今日簽到
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-today-count">
                    {stats?.summary?.today?.count || 0}
                  </p>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getTrendColor(stats?.summary?.today?.trend || 0)}`}>
                    {getTrendIcon(stats?.summary?.today?.trend || 0)}
                    <span>{Math.abs(stats?.summary?.today?.trend || 0)}%</span>
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                本週簽到
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-week-count">
                    {stats?.summary?.week?.count || 0}
                  </p>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getTrendColor(stats?.summary?.week?.trend || 0)}`}>
                    {getTrendIcon(stats?.summary?.week?.trend || 0)}
                    <span>{Math.abs(stats?.summary?.week?.trend || 0)}%</span>
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                本月簽到
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-month-count">
                    {stats?.summary?.month?.count || 0}
                  </p>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getTrendColor(stats?.summary?.month?.trend || 0)}`}>
                    {getTrendIcon(stats?.summary?.month?.trend || 0)}
                    <span>{Math.abs(stats?.summary?.month?.trend || 0)}%</span>
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                活躍人數
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-active-users">
                    {stats?.summary?.activeUsers?.total || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    今日活躍：{stats?.summary?.activeUsers?.today || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 趨勢圖 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>簽到趨勢分析（最近 7 天）</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "day" ? "default" : "outline"}
                  onClick={() => setViewMode("day")}
                  data-testid="button-view-day"
                >
                  日
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "week" ? "default" : "outline"}
                  onClick={() => setViewMode("week")}
                  data-testid="button-view-week"
                >
                  週
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "month" ? "default" : "outline"}
                  onClick={() => setViewMode("month")}
                  data-testid="button-view-month"
                >
                  月
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value as string);
                    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ea580c" 
                  strokeWidth={2}
                  name="簽到次數"
                  dot={{ fill: "#ea580c", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            {stats?.summary?.week && (
              <p className="text-sm text-gray-600 mt-4 text-center">
                本週簽到量較上週{stats.summary.week.trend > 0 ? "增加" : "減少"} {Math.abs(stats.summary.week.trend)}%
              </p>
            )}
          </CardContent>
        </Card>

        {/* 圓餅圖和長條圖 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>巡邏點熱度分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={patrolDistData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => 
                      `${entry.name} ${entry.value} (${((entry.percent || 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {patrolDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>時段分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeDistData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="簽到次數" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 最近簽到記錄 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最近簽到記錄</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/checkin/records")}
                data-testid="button-view-all"
              >
                查看全部 →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium text-gray-600">時間</th>
                    <th className="pb-3 font-medium text-gray-600">巡邏點</th>
                    <th className="pb-3 font-medium text-gray-600">使用者 ID</th>
                    <th className="pb-3 font-medium text-gray-600">狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats?.recentCheckins?.length > 0 ? (
                    stats.recentCheckins.map((checkin: any) => (
                      <tr key={checkin.id} className="hover:bg-gray-50">
                        <td className="py-3">
                          {new Date(checkin.timestamp).toLocaleString("zh-TW", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3">{checkin.patrolName}</td>
                        <td className="py-3 text-gray-500 text-xs">{checkin.uid.slice(0, 8)}...</td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            成功
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        暫無簽到記錄
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

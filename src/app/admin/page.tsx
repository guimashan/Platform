"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { platformAuth } from "@/lib/firebase-platform";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Calendar, FileText, LogOut, Loader2 } from "lucide-react";

interface UserPermissions {
  isSuperAdmin: boolean;
  roles: {
    checkin_admin?: boolean;
    schedule_admin?: boolean;
    service_admin?: boolean;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(platformAuth, async (currentUser) => {
      if (!currentUser) {
        router.push("/admin/login");
        return;
      }

      setUser(currentUser);

      try {
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/auth/permissions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setPermissions(data);
      } catch (err) {
        console.error("取得權限失敗:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(platformAuth);
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const hasCheckinAccess = permissions?.isSuperAdmin || permissions?.roles.checkin_admin;
  const hasScheduleAccess = permissions?.isSuperAdmin || permissions?.roles.schedule_admin;
  const hasServiceAccess = permissions?.isSuperAdmin || permissions?.roles.service_admin;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
              龜馬山管理中心
            </h1>
            <p className="text-muted-foreground mt-2">
              歡迎回來，{user?.displayName || user?.email}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            登出
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hasCheckinAccess && (
            <Card 
              className="cursor-pointer hover-elevate active-elevate-2 transition-shadow"
              onClick={() => router.push("/checkin/manage")}
              data-testid="card-checkin"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-4">
                  <ClipboardCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle>奉香簽到系統</CardTitle>
                <CardDescription>
                  管理巡邏點、查看簽到記錄、設定人員權限
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" data-testid="button-enter-checkin">
                  進入管理
                </Button>
              </CardContent>
            </Card>
          )}

          {hasScheduleAccess && (
            <Card className="cursor-pointer hover-elevate active-elevate-2 transition-shadow opacity-50">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>排班系統</CardTitle>
                <CardDescription>
                  即將推出
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  敬請期待
                </Button>
              </CardContent>
            </Card>
          )}

          {hasServiceAccess && (
            <Card className="cursor-pointer hover-elevate active-elevate-2 transition-shadow opacity-50">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>神務服務</CardTitle>
                <CardDescription>
                  即將推出
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  敬請期待
                </Button>
              </CardContent>
            </Card>
          )}

          {!hasCheckinAccess && !hasScheduleAccess && !hasServiceAccess && (
            <Card>
              <CardHeader>
                <CardTitle>無可用系統</CardTitle>
                <CardDescription>
                  您目前沒有任何系統的管理權限，請聯絡管理員
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

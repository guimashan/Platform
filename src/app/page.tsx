"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Monitor } from "lucide-react";

export default function HomePage() {
  const [isLineApp, setIsLineApp] = useState<boolean | null>(null);

  useEffect(() => {
    // 判斷是否在 LINE App 內
    const userAgent = navigator.userAgent.toLowerCase();
    const inLineApp = userAgent.includes('line');
    setIsLineApp(inLineApp);
  }, []);

  // Loading 狀態
  if (isLineApp === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </main>
    );
  }

  // LINE App 內 - 顯示前台入口
  if (isLineApp) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Smartphone className="w-12 h-12 text-blue-600" />
            </div>
            <CardTitle className="text-3xl md:text-4xl mb-2">
              龜馬山 goLine 平台
            </CardTitle>
            <CardDescription className="text-base">
              歡迎使用！請選擇服務
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Link href="/checkin" data-testid="link-checkin">
              <Button 
                variant="outline" 
                className="w-full h-16 text-xl hover-elevate"
                data-testid="button-checkin"
              >
                🙏 奉香簽到系統
              </Button>
            </Link>

            <Link href="/service" data-testid="link-service">
              <Button 
                variant="outline" 
                className="w-full h-16 text-xl hover-elevate"
                data-testid="button-service"
              >
                🏮 神務服務
              </Button>
            </Link>

            <Link href="/schedule" data-testid="link-schedule">
              <Button 
                variant="outline" 
                className="w-full h-16 text-xl hover-elevate"
                data-testid="button-schedule"
              >
                📅 志工排班系統
              </Button>
            </Link>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-gray-500">
                💡 管理者請使用電腦版登入後台
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // 外部瀏覽器 - 顯示後台登入
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Monitor className="w-12 h-12 text-gray-600" />
          </div>
          <CardTitle className="text-3xl md:text-4xl mb-2">
            龜馬山 goLine 平台
          </CardTitle>
          <CardDescription className="text-base">
            管理後台
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800 mb-2">
              👨‍💼 管理者登入
            </p>
            <p className="text-sm text-blue-600">
              使用 LINE 帳號登入管理後台
            </p>
          </div>

          <Link href="/admin/login" data-testid="link-admin-login">
            <Button 
              className="w-full h-14 text-lg"
              data-testid="button-admin-login"
            >
              進入管理後台
            </Button>
          </Link>

          <div className="border-t pt-6 space-y-3">
            <p className="text-center text-sm text-gray-600 font-medium">
              📱 一般使用者請於 LINE App 內開啟
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs text-gray-500 text-center">
                功能包括：
              </p>
              <div className="flex justify-center gap-4 text-xs text-gray-600">
                <span>🙏 奉香簽到</span>
                <span>🏮 神務服務</span>
                <span>📅 志工排班</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

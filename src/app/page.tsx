"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 md:p-12">
        {/* 標題 */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-12">
          龜馬山goLine平台
        </h1>

        {/* 上半部：一般使用者功能 */}
        <div className="space-y-4 mb-8">
          <Link href="/service" data-testid="link-service">
            <Button 
              variant="outline" 
              className="w-full h-16 text-xl rounded-full border-2 hover:border-gray-400 hover:bg-gray-50"
              data-testid="button-service"
            >
              神務服務
            </Button>
          </Link>

          <Link href="/checkin" data-testid="link-checkin">
            <Button 
              variant="outline" 
              className="w-full h-16 text-xl rounded-full border-2 hover:border-gray-400 hover:bg-gray-50"
              data-testid="button-checkin"
            >
              奉香簽到系統
            </Button>
          </Link>

          <Link href="/schedule" data-testid="link-schedule">
            <Button 
              variant="outline" 
              className="w-full h-16 text-xl rounded-full border-2 hover:border-gray-400 hover:bg-gray-50"
              data-testid="button-schedule"
            >
              志工排班系統
            </Button>
          </Link>
        </div>

        {/* 分隔線 */}
        <div className="border-t-2 border-gray-800 my-8"></div>

        {/* 下半部：管理功能 */}
        <div className="space-y-4">
          <Link href="/checkin/manage" data-testid="link-checkin-manage">
            <Button 
              variant="outline" 
              className="w-full h-16 text-xl rounded-full border-2 hover:border-gray-400 hover:bg-gray-50"
              data-testid="button-checkin-manage"
            >
              奉香簽到管理
            </Button>
          </Link>

          <Link href="/schedule/manage" data-testid="link-schedule-manage">
            <Button 
              variant="outline" 
              className="w-full h-16 text-xl rounded-full border-2 hover:border-gray-400 hover:bg-gray-50"
              data-testid="button-schedule-manage"
            >
              志工排班管理
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

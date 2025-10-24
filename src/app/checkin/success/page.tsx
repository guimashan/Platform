"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function CheckinSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patrolName, setPatrolName] = useState("");
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    const name = searchParams.get("patrol") || "未知地點";
    const ts = searchParams.get("ts");
    
    setPatrolName(name);
    
    if (ts) {
      const date = new Date(parseInt(ts));
      setTimestamp(date.toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }));
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-700" data-testid="text-success-title">
              簽到成功 ✅
            </h1>
            <p className="text-gray-600">
              感謝您的奉香！祝您修持精進，道氣長存。
            </p>
          </div>

          {patrolName && (
            <div className="bg-green-50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-gray-600">簽到地點</p>
              <p className="text-lg font-medium text-green-700" data-testid="text-patrol-name">
                {patrolName}
              </p>
              {timestamp && (
                <p className="text-xs text-gray-500" data-testid="text-timestamp">
                  {timestamp}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/checkin")}
              data-testid="button-back-checkin"
            >
              返回簽到
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => router.push("/checkin/history")}
              data-testid="button-view-history"
            >
              查看歷史
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

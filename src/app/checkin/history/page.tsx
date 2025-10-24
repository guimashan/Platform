"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, ArrowLeft } from "lucide-react";

interface CheckinHistory {
  id: string;
  patrolId: string;
  patrolName: string;
  ts: number;
}

export default function CheckinHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<CheckinHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const currentUser = authClient.currentUser;
      
      if (!currentUser) {
        setError("請先登入");
        router.push("/checkin");
        return;
      }

      const idToken = await currentUser.getIdToken();
      const response = await fetch(`/api/checkin/history?idToken=${encodeURIComponent(idToken)}&limit=50`);

      if (!response.ok) {
        throw new Error("載入失敗");
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error("載入歷史錯誤:", err);
      setError("載入失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/checkin")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-page-title">
              歷史簽到紀錄
            </h1>
            <p className="text-sm text-gray-500">查看您的奉香簽到記錄</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              所有簽到記錄
            </CardTitle>
            <CardDescription>最近 50 筆簽到記錄</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">載入中...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadHistory} data-testid="button-retry">
                  重新載入
                </Button>
              </div>
            )}

            {!loading && !error && history.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">尚無簽到記錄</p>
                <p className="text-sm mb-4">開始您的第一次奉香簽到</p>
                <Button onClick={() => router.push("/checkin")} data-testid="button-start-checkin">
                  前往簽到
                </Button>
              </div>
            )}

            {!loading && !error && history.length > 0 && (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-white hover-elevate"
                    data-testid={`history-item-${item.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900" data-testid={`history-patrol-${item.id}`}>
                        {item.patrolName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.ts).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

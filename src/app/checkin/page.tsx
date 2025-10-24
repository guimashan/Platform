"use client";

import { useEffect, useState } from "react";
import { initLiff, isLiffLoggedIn, liffLogin, getLiffIdToken, getLiffProfile } from "@/lib/liff";
import { authClient } from "@/lib/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Clock, CheckCircle, AlertCircle, User } from "lucide-react";

interface CheckinHistory {
  id: string;
  patrolId: string;
  patrolName: string;
  ts: number;
}

export default function CheckinPage() {
  const [liffReady, setLiffReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  
  const [qrInput, setQrInput] = useState("");
  const [checkinStatus, setCheckinStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  
  const [history, setHistory] = useState<CheckinHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 初始化 LIFF
  useEffect(() => {
    const setupLiff = async () => {
      try {
        await initLiff();
        setLiffReady(true);
        
        if (isLiffLoggedIn()) {
          setLoggedIn(true);
          const userProfile = await getLiffProfile();
          const lineIdToken = await getLiffIdToken();
          
          setProfile(userProfile);
          
          // 使用 LINE ID Token 登入 Firebase 並獲取 Firebase ID Token
          if (lineIdToken) {
            const firebaseIdToken = await authenticateWithFirebase(lineIdToken);
            await loadCheckinHistory(firebaseIdToken);
          }
        }
      } catch (error) {
        console.error("LIFF 初始化失敗:", error);
      }
    };

    setupLiff();
  }, []);

  // 使用 LINE ID Token 登入 Firebase
  const authenticateWithFirebase = async (lineIdToken: string) => {
    try {
      const response = await fetch("/api/auth/line", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: lineIdToken }),
      });

      if (!response.ok) {
        throw new Error("Firebase 認證失敗");
      }

      const { customToken } = await response.json();
      const userCredential = await signInWithCustomToken(authClient, customToken);
      
      // 🔑 關鍵修正：獲取 Firebase ID Token（而非 LINE LIFF Token）
      const firebaseIdToken = await userCredential.user.getIdToken();
      setIdToken(firebaseIdToken);
      
      return firebaseIdToken;
    } catch (error) {
      console.error("Firebase 認證錯誤:", error);
      throw error;
    }
  };

  // 載入簽到歷史
  const loadCheckinHistory = async (token: string) => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/checkin/history?idToken=${encodeURIComponent(token)}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("載入簽到歷史失敗:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 處理簽到
  const handleCheckin = async () => {
    if (!qrInput.trim()) {
      setStatusMessage("請輸入 QR Code");
      setCheckinStatus("error");
      return;
    }

    setCheckinStatus("loading");
    setStatusMessage("簽到中...");

    try {
      // 🔑 獲取最新的 Firebase ID Token（處理過期情況）
      const currentUser = authClient.currentUser;
      if (!currentUser) {
        setStatusMessage("請重新登入");
        setCheckinStatus("error");
        setLoggedIn(false);
        return;
      }
      
      const freshIdToken = await currentUser.getIdToken(true);
      
      const response = await fetch("/api/checkin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: freshIdToken,
          qrCode: qrInput.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCheckinStatus("success");
        setStatusMessage(`✅ 簽到成功！地點：${data.checkin.patrolName}`);
        setQrInput("");
        
        // 重新載入歷史記錄
        const currentUser = authClient.currentUser;
        if (currentUser) {
          const freshIdToken = await currentUser.getIdToken();
          await loadCheckinHistory(freshIdToken);
        }
        
        // 3秒後重置狀態
        setTimeout(() => {
          setCheckinStatus("idle");
          setStatusMessage("");
        }, 3000);
      } else {
        setCheckinStatus("error");
        setStatusMessage(data.error || "簽到失敗");
        
        // 5秒後重置狀態
        setTimeout(() => {
          setCheckinStatus("idle");
          setStatusMessage("");
        }, 5000);
      }
    } catch (error) {
      console.error("簽到錯誤:", error);
      setCheckinStatus("error");
      setStatusMessage("網路錯誤，請稍後再試");
      
      setTimeout(() => {
        setCheckinStatus("idle");
        setStatusMessage("");
      }, 5000);
    }
  };

  // 處理 LINE 登入
  const handleLogin = () => {
    if (liffReady) {
      liffLogin();
    }
  };

  // LIFF 尚未準備好
  if (!liffReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 未登入狀態
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">龜馬山奉香簽到系統</CardTitle>
            <CardDescription>請使用 LINE 帳號登入</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-orange-600" />
            </div>
            <Button
              onClick={handleLogin}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              size="lg"
              data-testid="button-line-login"
            >
              使用 LINE 登入
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 已登入狀態 - 主介面
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile?.pictureUrl && (
              <img
                src={profile.pictureUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full"
                data-testid="img-profile"
              />
            )}
            {!profile?.pictureUrl && (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div>
              <p className="font-medium text-sm" data-testid="text-display-name">
                {profile?.displayName || "使用者"}
              </p>
              <p className="text-xs text-gray-500">龜馬山奉香簽到</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* QR Code 簽到區 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-600" />
              掃描 QR Code 簽到
            </CardTitle>
            <CardDescription>請掃描巡邏點的 QR Code 或手動輸入</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="輸入 QR Code（例如：PATROL_YUJI_2025）"
              disabled={checkinStatus === "loading"}
              data-testid="input-qr-code"
            />
            
            <Button
              onClick={handleCheckin}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
              disabled={checkinStatus === "loading" || !qrInput.trim()}
              data-testid="button-checkin"
            >
              {checkinStatus === "loading" ? "簽到中..." : "確認簽到"}
            </Button>

            {/* 狀態訊息 */}
            {statusMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  checkinStatus === "success"
                    ? "bg-green-50 text-green-700"
                    : checkinStatus === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
                }`}
                data-testid="text-status-message"
              >
                {checkinStatus === "success" && <CheckCircle className="w-5 h-5" />}
                {checkinStatus === "error" && <AlertCircle className="w-5 h-5" />}
                <span className="text-sm">{statusMessage}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 簽到歷史 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              簽到歷史
            </CardTitle>
            <CardDescription>最近 20 筆簽到記錄</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory && (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                載入中...
              </div>
            )}

            {!loadingHistory && history.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">尚無簽到記錄</p>
                <p className="text-xs mt-1">掃描 QR Code 開始簽到</p>
              </div>
            )}

            {!loadingHistory && history.length > 0 && (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white hover-elevate"
                    data-testid={`history-item-${item.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm" data-testid={`history-patrol-${item.id}`}>
                        {item.patrolName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.ts).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快速參考 */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-900 font-medium mb-2">📍 巡邏點 QR Code 參考：</p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• 玉旨牌：PATROL_YUJI_2025</li>
              <li>• 萬應公：PATROL_WANYING_2025</li>
              <li>• 辦公室：PATROL_OFFICE_2025</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

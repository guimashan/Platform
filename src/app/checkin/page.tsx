"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initLiff, isLiffLoggedIn, liffLogin, getLiffIdToken, getLiffProfile, getDecodedIdToken } from "@/lib/liff";
import { authClient } from "@/lib/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Clock, User, MapPin, Scan } from "lucide-react";
import { apiRequest } from "@/lib/apiRequest";
import type { LineAuthResponse } from "@/shared/schema";

interface PatrolPoint {
  id: string;
  name: string;
  qrCode: string;
  enabled: boolean;
}

export default function CheckinPage() {
  const router = useRouter();
  const [liffReady, setLiffReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [qrInput, setQrInput] = useState("");
  const [checkinStatus, setCheckinStatus] = useState<"idle" | "loading">("idle");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [patrolPoints, setPatrolPoints] = useState<PatrolPoint[]>([]);

  // 初始化 LIFF 並登入
  useEffect(() => {
    handleLiffInit();
  }, []);

  const handleLiffInit = async () => {
    try {
      setLoading(true);
      await initLiff();
      setLiffReady(true);

      if (!isLiffLoggedIn()) {
        liffLogin();
        return;
      }

      // 取得 LINE Profile
      const userProfile = await getLiffProfile();
      if (!userProfile) {
        throw new Error("無法取得使用者資料");
      }

      // 取得 ID Token
      const lineIdToken = await getLiffIdToken();
      if (!lineIdToken) {
        throw new Error("無法取得登入憑證");
      }

      // 取得 email
      const decodedToken = getDecodedIdToken();
      const email = decodedToken?.email;

      if (!email) {
        setError("您的 LINE 帳號未設定 Email，請聯絡管理員");
        setLoading(false);
        return;
      }

      // 登入 Firebase
      const response = await apiRequest<LineAuthResponse>("POST", "/api/auth/line", {
        idToken: lineIdToken,
        email: email,
        displayName: userProfile.displayName,
        pictureUrl: userProfile.pictureUrl,
      });

      if (!response.ok || !response.customToken) {
        throw new Error(response.error || "認證失敗");
      }

      await signInWithCustomToken(authClient, response.customToken);

      setProfile(userProfile);
      setLoggedIn(true);

      // 載入巡邏點列表
      await loadPatrolPoints();

      // 請求 GPS 權限
      requestLocationPermission();
    } catch (err: any) {
      console.error("初始化錯誤:", err);
      setError(err?.message || "初始化失敗");
    } finally {
      setLoading(false);
    }
  };

  // 載入巡邏點列表
  const loadPatrolPoints = async () => {
    try {
      const response = await fetch("/api/checkin/points");
      if (response.ok) {
        const data = await response.json();
        setPatrolPoints(data.points || []);
      }
    } catch (err) {
      console.error("載入巡邏點失敗:", err);
    }
  };

  // 請求位置權限
  const requestLocationPermission = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("GPS 錯誤:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // 掃描 QR Code
  const handleScanQR = async () => {
    try {
      // 使用 LIFF SDK 的 scanCodeV2
      const liff = (window as any).liff;
      if (!liff || !liff.scanCodeV2) {
        alert("QR Code 掃描功能只能在 LINE App 中使用");
        return;
      }

      const result = await liff.scanCodeV2();
      if (result && result.value) {
        setQrInput(result.value);
      }
    } catch (err: any) {
      console.error("掃描失敗:", err);
      if (err.code !== 'CANCEL') {
        alert("掃描失敗，請手動輸入或重試");
      }
    }
  };

  // 獲取 GPS 位置
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("您的裝置不支援 GPS 定位"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          reject(new Error(`GPS 定位失敗: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // 處理簽到
  const handleCheckin = async () => {
    if (!qrInput.trim()) {
      alert("請輸入或掃描 QR Code");
      return;
    }

    setCheckinStatus("loading");

    try {
      // 獲取 GPS 位置
      let locationData = userLocation;
      if (!locationData) {
        try {
          locationData = await getCurrentLocation();
        } catch (error: any) {
          console.error("GPS 獲取失敗:", error);
        }
      }

      // 獲取 Firebase ID Token
      const currentUser = authClient.currentUser;
      if (!currentUser) {
        router.push("/checkin/fail?error=請重新登入");
        return;
      }

      const freshIdToken = await currentUser.getIdToken(true);

      const response = await fetch("/api/checkin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: freshIdToken,
          qrCode: qrInput.trim(),
          userLat: locationData?.lat,
          userLng: locationData?.lng,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const params = new URLSearchParams({
          patrol: data.checkin.patrolName,
          ts: data.checkin.timestamp.toString(),
        });
        router.push(`/checkin/success?${params.toString()}`);
      } else {
        const params = new URLSearchParams({
          error: data.error || "簽到失敗",
        });
        router.push(`/checkin/fail?${params.toString()}`);
      }
    } catch (error) {
      console.error("簽到錯誤:", error);
      router.push("/checkin/fail?error=網路錯誤");
    } finally {
      setCheckinStatus("idle");
    }
  };

  // Loading 狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">發生錯誤</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-700">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              重新載入
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 已登入 - 主介面
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
              <p className="text-xs text-gray-500">奉香簽到</p>
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
              QR Code 簽到
            </CardTitle>
            <CardDescription>掃描或手動輸入巡邏點 QR Code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="輸入 QR Code"
                disabled={checkinStatus === "loading"}
                data-testid="input-qr-code"
                className="flex-1"
              />
              <Button
                onClick={handleScanQR}
                variant="outline"
                size="icon"
                disabled={checkinStatus === "loading"}
                data-testid="button-scan-qr"
                className="shrink-0"
              >
                <Scan className="w-5 h-5" />
              </Button>
            </div>

            <Button
              onClick={handleCheckin}
              className="w-full bg-orange-600 hover:bg-orange-700 h-12"
              disabled={checkinStatus === "loading" || !qrInput.trim()}
              data-testid="button-checkin"
            >
              {checkinStatus === "loading" ? "簽到中..." : "確認簽到"}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/checkin/history")}
              className="w-full"
              data-testid="button-view-history"
            >
              <Clock className="w-4 h-4 mr-2" />
              查看簽到歷史
            </Button>
          </CardContent>
        </Card>

        {/* 巡邏點列表 */}
        {patrolPoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4 text-orange-600" />
                巡邏點列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patrolPoints
                  .filter(p => p.enabled)
                  .map((point) => (
                    <button
                      key={point.id}
                      onClick={() => setQrInput(point.qrCode)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                      data-testid={`button-patrol-${point.id}`}
                    >
                      <p className="font-medium text-sm">{point.name}</p>
                      <p className="text-xs text-gray-500">{point.qrCode}</p>
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* GPS 狀態 */}
        {userLocation && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <p className="text-xs text-green-800">
                ✅ GPS 定位成功 ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

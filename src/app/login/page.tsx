"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { authClient } from "@/lib/firebase";
import { initLiff, isLiffLoggedIn, liffLogin, getLiffIdToken, getLiffProfile, getDecodedIdToken } from "@/lib/liff";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import ErrorAlert from "@/components/ui/error-alert";
import { apiRequest } from "@/lib/apiRequest";
import type { LineAuthResponse } from "@/shared/schema";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("正在初始化 LINE 登入...");
  const [error, setError] = useState<string | null>(null);
  const [needEmailInput, setNeedEmailInput] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [lineIdToken, setLineIdToken] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleLineLogin();
  }, [router]);

  const handleLineLogin = async () => {
    try {
      // 1. 初始化 LIFF
      setMessage("正在初始化 LINE 登入...");
      await initLiff();

      // 2. 檢查是否已登入
      if (!isLiffLoggedIn()) {
        setMessage("請使用 LINE 登入");
        liffLogin();
        return;
      }

      // 3. 獲取 ID Token 和 Profile
      setMessage("正在驗證身份...");
      const idToken = await getLiffIdToken();
      if (!idToken) {
        throw new Error("無法取得 LINE 登入憑證");
      }

      const profile = await getLiffProfile();
      const decodedToken = getDecodedIdToken();
      const email = decodedToken?.email;

      // 如果沒有 email，顯示輸入框
      if (!email) {
        setLineProfile(profile);
        setLineIdToken(idToken);
        setNeedEmailInput(true);
        setMessage("");
        return;
      }

      // 有 email，直接登入
      await completeLineLogin(idToken, email, profile);
    } catch (e: any) {
      console.error("登入錯誤:", e);
      setError(e?.message || String(e));
    }
  };

  const handleManualEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualEmail || !manualEmail.includes("@")) {
      setError("請輸入有效的 Email 地址");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await completeLineLogin(lineIdToken, manualEmail, lineProfile);
    } catch (e: any) {
      console.error("登入錯誤:", e);
      setError(e?.message || String(e));
      setLoading(false);
    }
  };

  const completeLineLogin = async (idToken: string, email: string, profile: any) => {
    // 4. 呼叫後端 API 換取 Firebase Custom Token
    setMessage("正在連接伺服器...");
    const response = await apiRequest<LineAuthResponse>(
      "POST",
      "/api/auth/line",
      { 
        idToken,
        email,
        displayName: profile?.displayName,
        pictureUrl: profile?.pictureUrl
      }
    );

    if (!response.ok || !response.customToken) {
      throw new Error(response.error || "伺服器認證失敗");
    }

    // 5. 使用 Custom Token 登入 Firebase
    setMessage("正在完成登入...");
    await signInWithCustomToken(authClient, response.customToken);

    // 6. 登入成功，導向首頁
    setMessage("登入成功！");
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const cancelEmailInput = () => {
    setNeedEmailInput(false);
    setManualEmail("");
    setLineProfile(null);
    setLineIdToken("");
    setError(null);
    router.push("/");
  };

  if (needEmailInput) {
    return (
      <main className="min-h-screen flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle data-testid="text-login-title">LINE 登入</CardTitle>
            <CardDescription>請輸入您的 Email 完成註冊</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800 mb-2">
                <strong>LINE 使用者：</strong>{lineProfile?.displayName}
              </p>
              <p className="text-xs text-blue-600">
                由於 LINE 帳號未公開 Email，請手動輸入您的 Email 地址以完成註冊。
              </p>
            </div>

            <form onSubmit={handleManualEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-email">Email 地址</Label>
                <Input
                  id="manual-email"
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                  data-testid="input-manual-email"
                />
                <p className="text-xs text-gray-500">
                  此 Email 將用於系統通知和後續登入
                </p>
              </div>

              {error && <ErrorAlert message={error} />}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={cancelEmailInput}
                  disabled={loading}
                  data-testid="button-cancel"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                  data-testid="button-submit-email"
                >
                  {loading ? "處理中..." : "完成註冊"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle data-testid="text-login-title">LINE 登入</CardTitle>
          <CardDescription>使用您的 LINE 帳號快速登入</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!error ? (
            <div className="text-center">
              <Spinner label={message} />
            </div>
          ) : (
            <>
              <ErrorAlert message={error} />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/")}
                  data-testid="button-back-home"
                >
                  回首頁
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => window.location.reload()}
                  data-testid="button-retry"
                >
                  重試
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

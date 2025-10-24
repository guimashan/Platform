"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { platformAuth } from "@/lib/firebase-platform";
import { signInWithEmailAndPassword, signInWithCustomToken } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertCircle } from "lucide-react";
import liff from "@line/liff";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liffReady, setLiffReady] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "line">("email");
  
  // LINE 登入相關狀態
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [lineIdToken, setLineIdToken] = useState<string>("");
  const [needEmailInput, setNeedEmailInput] = useState(false);
  const [manualEmail, setManualEmail] = useState("");

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
        if (!liffId) {
          console.error("LIFF ID 未設定");
          return;
        }
        await liff.init({ liffId });
        setLiffReady(true);
      } catch (error) {
        console.error("LIFF 初始化失敗:", error);
      }
    };

    initLiff();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(platformAuth, email, password);
      router.push("/admin");
    } catch (err: any) {
      console.error("登入錯誤:", err);
      
      if (err.code === "auth/invalid-credential") {
        setError("電子郵件或密碼錯誤");
      } else if (err.code === "auth/too-many-requests") {
        setError("登入嘗試次數過多，請稍後再試");
      } else {
        setError("登入失敗，請稍後再試");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLineLogin = async () => {
    if (!liffReady) {
      setError("LINE 登入尚未準備就緒");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      // 取得 ID Token 和 Profile
      const idToken = liff.getIDToken();
      if (!idToken) {
        setError("無法取得 LINE ID Token");
        return;
      }

      const profile = await liff.getProfile();
      const email = liff.getDecodedIDToken()?.email;

      // 如果沒有 email，顯示輸入框讓用戶填寫
      if (!email) {
        setLineProfile(profile);
        setLineIdToken(idToken);
        setNeedEmailInput(true);
        setLoading(false);
        return;
      }

      // 有 email，直接登入
      await completeLineLogin(idToken, email, profile);
    } catch (err: any) {
      console.error("LINE 登入錯誤:", err);
      setError(err.message || "LINE 登入失敗，請稍後再試");
      setLoading(false);
    }
  };

  const handleManualEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualEmail || !manualEmail.includes("@")) {
      setError("請輸入有效的 Email 地址");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await completeLineLogin(lineIdToken, manualEmail, lineProfile);
    } catch (err: any) {
      console.error("LINE 登入錯誤:", err);
      setError(err.message || "LINE 登入失敗，請稍後再試");
      setLoading(false);
    }
  };

  const completeLineLogin = async (idToken: string, email: string, profile: any) => {
    const response = await fetch("/api/auth/line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        idToken,
        email,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "LINE 認證失敗");
    }

    const { customToken, hasPassword } = await response.json();
    await signInWithCustomToken(platformAuth, customToken);
    
    // 根據是否已設定密碼跳轉
    if (hasPassword) {
      router.push("/admin");
    } else {
      router.push("/admin/setup");
    }
  };

  const cancelEmailInput = () => {
    setNeedEmailInput(false);
    setManualEmail("");
    setLineProfile(null);
    setLineIdToken("");
    setError("");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <ShieldCheck className="w-9 h-9 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">管理員登入</CardTitle>
          <CardDescription>
            {needEmailInput ? "請輸入您的 Email" : "選擇登入方式訪問管理後台"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!needEmailInput ? (
            <>
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  variant={loginMethod === "email" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setLoginMethod("email")}
                  data-testid="button-method-email"
                >
                  Email 登入
                </Button>
                <Button
                  type="button"
                  variant={loginMethod === "line" ? "default" : "outline"}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setLoginMethod("line")}
                  data-testid="button-method-line"
                >
                  LINE 登入
                </Button>
              </div>

              {loginMethod === "email" ? (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">電子郵件</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      required
                      disabled={loading}
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">密碼</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      data-testid="input-password"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md" data-testid="error-message">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                    data-testid="button-login"
                  >
                    {loading ? "登入中..." : "使用 Email 登入"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <Button
                    type="button"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleLineLogin}
                    disabled={loading || !liffReady}
                    data-testid="button-line-login"
                  >
                    {loading ? "登入中..." : !liffReady ? "準備中..." : "使用 LINE 登入"}
                  </Button>

                  {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md" data-testid="error-message">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 text-center">
                    點擊按鈕後將透過 LINE 進行身份驗證
                  </p>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleManualEmailSubmit} className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>LINE 使用者：</strong>{lineProfile?.displayName}
                </p>
                <p className="text-xs text-blue-600">
                  由於 LINE 帳號未公開 Email，請手動輸入您的 Email 地址以完成註冊。
                </p>
              </div>

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

              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md" data-testid="error-message">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

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
          )}
        </CardContent>
      </Card>
    </main>
  );
}

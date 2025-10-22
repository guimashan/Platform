"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { authClient } from "@/lib/firebase";
import { initLiff, isLiffLoggedIn, liffLogin, getLiffIdToken } from "@/lib/liff";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import ErrorAlert from "@/components/ui/error-alert";
import { apiRequest } from "@/lib/apiRequest";
import type { LineAuthResponse } from "@/shared/schema";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("正在初始化 LINE 登入...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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

        // 3. 獲取 ID Token
        setMessage("正在驗證身份...");
        const idToken = await getLiffIdToken();
        if (!idToken) {
          throw new Error("無法取得 LINE 登入憑證");
        }

        // 4. 呼叫後端 API 換取 Firebase Custom Token
        setMessage("正在連接伺服器...");
        const response = await apiRequest<LineAuthResponse>(
          "POST",
          "/api/auth/line",
          { idToken }
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
      } catch (e: any) {
        console.error("登入錯誤:", e);
        setError(e?.message || String(e));
      }
    })();
  }, [router]);

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

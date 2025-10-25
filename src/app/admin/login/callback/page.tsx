"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { platformAuth } from "@/lib/firebase-platform";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import ErrorAlert from "@/components/ui/error-alert";

export default function AdminLoginCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[Callback] 開始處理登入 callback...');
        
        // 從後端 API 取得存在 HTTP-only cookie 的 token
        const response = await fetch('/api/auth/token');
        console.log('[Callback] Token API 回應狀態:', response.status);
        
        const data = await response.json();
        console.log('[Callback] Token API 回應資料:', { ok: data.ok, hasToken: !!data.token, error: data.error });
        
        if (!data.ok || !data.token) {
          const errorMsg = data.error === "NO_TOKEN" 
            ? "登入憑證已過期，請重新登入" 
            : `無法取得登入憑證: ${data.error || '未知錯誤'}`;
          console.error('[Callback] Token 取得失敗:', errorMsg);
          setError(errorMsg);
          return;
        }

        console.log('[Callback] 嘗試使用 Custom Token 登入 Firebase...');
        // 使用 Custom Token 登入 Firebase
        const userCredential = await signInWithCustomToken(platformAuth, data.token);
        console.log('[Callback] Firebase 登入成功！UID:', userCredential.user.uid);

        // 登入成功，導向統一管理中心
        console.log('[Callback] 準備跳轉到 /admin...');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } catch (err: any) {
        console.error("[Callback] 登入錯誤:", err);
        const errorMsg = err?.message || "登入失敗";
        setError(`登入失敗: ${errorMsg}`);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">登入失敗</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ErrorAlert message={error} />
            <Button
              onClick={() => router.push('/admin/login')}
              className="w-full"
              data-testid="button-retry"
            >
              返回登入頁
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">登入處理中</CardTitle>
        </CardHeader>
        <CardContent>
          <Spinner label="正在完成登入..." />
        </CardContent>
      </Card>
    </main>
  );
}

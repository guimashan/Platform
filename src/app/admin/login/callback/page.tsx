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
        // 從後端 API 取得存在 HTTP-only cookie 的 token
        const response = await fetch('/api/auth/token');
        const data = await response.json();
        
        if (!data.ok || !data.token) {
          setError(data.error === "NO_TOKEN" ? "登入憑證已過期，請重新登入" : "無法取得登入憑證");
          return;
        }

        // 使用 Custom Token 登入 Firebase
        await signInWithCustomToken(platformAuth, data.token);

        // 登入成功，導向統一管理中心
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } catch (err: any) {
        console.error("登入錯誤:", err);
        setError(err?.message || "登入失敗");
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

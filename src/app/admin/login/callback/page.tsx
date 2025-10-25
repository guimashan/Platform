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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        addDebug('開始處理登入 callback...');
        
        // 從後端 API 取得存在 HTTP-only cookie 的 token
        const response = await fetch('/api/auth/token');
        addDebug(`Token API 回應狀態: ${response.status}`);
        
        const data = await response.json();
        addDebug(`Token API 回應: ${JSON.stringify({ ok: data.ok, hasToken: !!data.token, error: data.error })}`);
        
        if (!data.ok || !data.token) {
          const errorMsg = data.error === "NO_TOKEN" 
            ? "登入憑證已過期，請重新登入" 
            : `無法取得登入憑證: ${data.error || '未知錯誤'}`;
          addDebug(`Token 取得失敗: ${errorMsg}`);
          setError(errorMsg);
          return;
        }

        addDebug('嘗試使用 Custom Token 登入 Firebase...');
        // 使用 Custom Token 登入 Firebase
        const userCredential = await signInWithCustomToken(platformAuth, data.token);
        addDebug(`Firebase 登入成功！UID: ${userCredential.user.uid}`);

        // 登入成功，導向統一管理中心
        addDebug('準備跳轉到 /admin...');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } catch (err: any) {
        const errorMsg = err?.message || "登入失敗";
        addDebug(`登入錯誤: ${errorMsg}`);
        setError(`登入失敗: ${errorMsg}`);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-red-50">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-red-600">登入失敗</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ErrorAlert message={error} />
            
            {/* 顯示除錯訊息 */}
            <div className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-60">
              <p className="font-bold mb-2">除錯資訊：</p>
              {debugInfo.map((info, i) => (
                <p key={i} className="text-gray-700">{info}</p>
              ))}
            </div>
            
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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">登入處理中</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Spinner label="正在完成登入..." />
          
          {/* 即時顯示除錯訊息 */}
          {debugInfo.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg text-xs overflow-auto max-h-60">
              <p className="font-bold mb-2 text-blue-800">處理進度：</p>
              {debugInfo.map((info, i) => (
                <p key={i} className="text-blue-700">{info}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

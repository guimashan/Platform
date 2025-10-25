"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle } from "lucide-react";
import ErrorAlert from "@/components/ui/error-alert";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 檢查是否有錯誤參數
    const errorParam = searchParams?.get('error');
    
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'Configuration': 'LINE Channel 設定錯誤，請聯絡系統管理員',
        'AccessDenied': '存取被拒絕',
        'Verification': '驗證失敗',
        'OAuthSignin': '無法初始化 LINE 登入',
        'OAuthCallback': 'LINE 回調處理失敗',
        'OAuthCreateAccount': '無法建立帳號',
        'EmailCreateAccount': '無法建立 Email 帳號',
        'Callback': '回調處理錯誤',
        'OAuthAccountNotLinked': '此帳號已連結其他登入方式',
        'EmailSignin': 'Email 登入失敗',
        'CredentialsSignin': '登入憑證錯誤',
        'SessionRequired': '需要登入',
        'Default': '登入失敗，請稍後再試',
      };
      
      const errorMsg = errorMessages[errorParam] || errorMessages['Default'];
      setError(errorMsg);
    }
  }, [searchParams]);

  const handleLineLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 使用 NextAuth 的 signIn 函數
      const result = await signIn('line', {
        callbackUrl: '/admin',
        redirect: true,
      });
      
      if (result?.error) {
        setError(`登入失敗: ${result.error}`);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("登入錯誤:", err);
      setError(err?.message || "登入失敗，請稍後再試");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            管理後台登入
          </CardTitle>
          <CardDescription className="text-base mt-2">
            使用 LINE 帳號登入管理系統
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <ErrorAlert message={error} />
          )}

          <div className="space-y-4">
            <Button
              onClick={handleLineLogin}
              disabled={isLoading}
              className="w-full h-14 text-lg bg-[#06C755] hover:bg-[#05b04b] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-line-login"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登入中...
                </span>
              ) : (
                <>
                  <svg 
                    className="w-6 h-6 mr-2" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                  使用 LINE 登入
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  管理者專用
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 text-sm text-blue-800">
                  <p className="font-medium">管理權限說明</p>
                  <ul className="space-y-1 text-xs text-blue-700">
                    <li>• PowerUser：查看紀錄、匯出報表</li>
                    <li>• Admin：管理巡邏點、使用者</li>
                    <li>• SuperAdmin：完整後台權限</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">
              📱 一般使用者請於 LINE App 內開啟
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              data-testid="button-back-home"
            >
              返回首頁
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            載入中...
          </CardContent>
        </Card>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}

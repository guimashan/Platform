"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function CheckinFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const message = searchParams.get("error") || "簽到失敗，請重試";
    setErrorMessage(message);
  }, [searchParams]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-red-600" data-testid="text-fail-title">
              簽到失敗 ❌
            </h1>
            <p className="text-gray-600" data-testid="text-error-message">
              {errorMessage}
            </p>
            <p className="text-sm text-gray-500">
              請確認您的位置或網路連線，再試一次。
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-4 space-y-2 text-left">
            <p className="text-sm font-medium text-gray-700">可能的原因：</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>QR Code 無效或已過期</li>
              <li>網路連線不穩定</li>
              <li>5 分鐘內重複簽到</li>
              <li>登入資訊已過期</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => router.push("/checkin")}
              data-testid="button-retry-checkin"
            >
              重新簽到
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

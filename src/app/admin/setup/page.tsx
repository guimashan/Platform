"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { platformAuth } from "@/lib/firebase-platform";
import { onAuthStateChanged } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AdminSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(platformAuth, async (user) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }

      // 從後端取得 email
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/auth/check-setup", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.hasPassword) {
          // 已經設定過密碼，直接進入管理中心
          router.push("/admin");
          return;
        }
        
        setEmail(data.email || "");
      } catch (err) {
        console.error("檢查失敗:", err);
        setError("無法取得帳號資訊");
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("密碼至少需要 6 個字元");
      return;
    }

    if (password !== confirmPassword) {
      setError("密碼不一致");
      return;
    }

    setLoading(true);

    try {
      const user = platformAuth.currentUser;
      if (!user) {
        throw new Error("未登入");
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "設定失敗");
      }

      router.push("/admin");
    } catch (err: any) {
      console.error("設定密碼錯誤:", err);
      setError(err.message || "設定失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">設定電腦登入密碼</CardTitle>
          <CardDescription>
            設定後即可在電腦上使用 Email + 密碼登入
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">您的 Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
                data-testid="input-email"
              />
              <p className="text-sm text-muted-foreground">
                這是從您的 LINE 帳號取得的 Email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">設定密碼</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少 6 個字元"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                data-testid="input-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">確認密碼</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次輸入密碼"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                data-testid="input-confirm-password"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  設定中...
                </>
              ) : (
                "完成設定"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

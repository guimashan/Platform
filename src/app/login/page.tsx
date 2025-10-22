"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import { signInWithCustomToken } from "firebase/auth";
import { authClient } from "@/lib/firebase";

const ALLOW_PATHS = new Set<string>([
  "/checkin",
  "/ok",
  "/service",
  "/", // 允許回首頁
]);

function resolveNextPath(raw: string | null): string {
  if (!raw) return "/"; // 【先不導 /checkin】避免你說的尚未就緒
  try {
    const url = new URL(raw, window.location.origin);
    const path = url.pathname + (url.search || "") + (url.hash || "");
    return ALLOW_PATHS.has(url.pathname) ? path : "/";
  } catch {
    return "/";
  }
}

export default function Page() {
  const [msg, setMsg] = useState("初始化中…");

  useEffect(() => {
    (async () => {
      try {
        // 1) 初始化 LIFF
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID! });

        // 2) 未登入就呼叫 LIFF login（回到本頁）
        if (!liff.isLoggedIn()) {
          liff.login(); // 會自動回來 /login
          return;
        }

        // 3) 拿 LINE ID Token
        const idToken = await liff.getIDToken();
        if (!idToken) throw new Error("無法取得 LINE ID Token");

        // 4) 送到你的 server 交換 Firebase Custom Token
        const res = await fetch("/api/auth/line", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.customToken) {
          throw new Error(
            `交換 customToken 失敗：${data?.error || res.statusText}`
          );
        }

        // 5) 登入 Firebase
        await signInWithCustomToken(authClient, data.customToken);

        // 6) 依網址的 next 導頁（白名單保護）
        const next = resolveNextPath(
          new URL(location.href).searchParams.get("next")
        );
        setMsg("登入成功，正在導向…");
        location.replace(next);
      } catch (e: any) {
        setMsg(`登入失敗：${e?.message || String(e)}`);
      }
    })();
  }, []);

  return <main style={{ padding: 24 }}>{msg}</main>;
}

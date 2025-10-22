"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { authClient } from "@/lib/firebase";

export default function Page() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authClient, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      {user ? (
        <>
          <h1>打卡頁</h1>
          <p>歡迎登入，使用者 ID：{user.uid}</p>
        </>
      ) : (
        <>
          <h1>未登入</h1>
          <p>請先登入 LINE 或 Firebase 帳號</p>
        </>
      )}
    </main>
  );
}

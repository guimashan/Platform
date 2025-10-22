"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* 標題區塊 */}
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2">
          龜馬山 goLine 平台
        </h1>
        <p className="text-gray-600 text-base md:text-lg">
          LINE 登入 / 打卡 / 服務 / 排班 一站式平台
        </p>
      </header>

      {/* 功能連結 */}
      <section className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/login"
          className="w-full text-center py-4 rounded-2xl bg-green-600 text-white text-lg font-semibold shadow-md hover:bg-green-700 transition"
        >
          Line登入
        </Link>
        <Link
          href="/checkin"
          className="w-full text-center py-4 rounded-2xl bg-blue-500 text-white text-lg font-semibold shadow-md hover:bg-blue-600 transition"
        >
          奉香簽到系統
        </Link>
        <Link
          href="/service"
          className="w-full text-center py-4 rounded-2xl bg-purple-500 text-white text-lg font-semibold shadow-md hover:bg-purple-600 transition"
        >
          神務服務
        </Link>
        <Link
          href="/schedule"
          className="w-full text-center py-4 rounded-2xl bg-orange-500 text-white text-lg font-semibold shadow-md hover:bg-orange-600 transition"
        >
          志工排班系統
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-10 text-gray-400 text-sm">
        © {new Date().getFullYear()} 龜馬山 goLine 平台
      </footer>
    </main>
  );
}

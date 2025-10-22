"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, ClipboardCheck, PackageSearch, Calendar } from "lucide-react";

export default function HomePage() {
  const services = [
    {
      href: "/login",
      title: "LINE 登入",
      description: "使用 LINE 快速登入平台",
      icon: LogIn,
      color: "text-primary",
    },
    {
      href: "/checkin",
      title: "奉香簽到系統",
      description: "志工與信眾快速簽到",
      icon: ClipboardCheck,
      color: "text-chart-2",
    },
    {
      href: "/service",
      title: "神務服務",
      description: "服務申請與查詢",
      icon: PackageSearch,
      color: "text-chart-4",
    },
    {
      href: "/schedule",
      title: "志工排班系統",
      description: "班表與換班一把罩",
      icon: Calendar,
      color: "text-chart-5",
    },
  ];

  return (
    <main className="min-h-screen py-10 md:py-16">
      <section className="text-center mb-10 md:mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          龜馬山 <span className="text-primary">goLine</span> 平台
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          LINE 登入・打卡・服務・排班，一站完成
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto px-4">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Link key={service.href} href={service.href} data-testid={`link-${service.href.slice(1)}`}>
              <Card className="h-full hover-elevate active-elevate-2 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-semibold" data-testid={`title-${service.href.slice(1)}`}>
                    {service.title}
                  </CardTitle>
                  <Icon className={`h-6 w-6 ${service.color}`} />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base" data-testid={`desc-${service.href.slice(1)}`}>
                    {service.description}
                  </CardDescription>
                  <Button className="mt-4 w-full" data-testid={`button-goto-${service.href.slice(1)}`}>
                    前往
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

    </main>
  );
}

"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, ClipboardCheck, PackageSearch, Calendar } from "lucide-react";

export default function HomePage() {
  const services = [
    {
      href: "/checkin",
      title: "奉香簽到",
      description: "📱 手機掃描 QR Code 快速簽到",
      icon: ClipboardCheck,
      color: "text-orange-600",
      primary: true,
    },
    {
      href: "/admin/login",
      title: "管理後台",
      description: "💻 電腦登入管理中心",
      icon: LogIn,
      color: "text-blue-600",
      primary: false,
    },
    {
      href: "/service",
      title: "神務服務",
      description: "服務申請與查詢",
      icon: PackageSearch,
      color: "text-green-600",
      primary: false,
    },
    {
      href: "/schedule",
      title: "志工排班",
      description: "班表管理與換班",
      icon: Calendar,
      color: "text-purple-600",
      primary: false,
    },
  ];

  return (
    <main className="min-h-screen py-10 md:py-16">
      <section className="text-center mb-10 md:mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          龜馬山 <span className="text-orange-600">整合服務平台</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          奉香簽到・管理後台・神務服務・志工排班
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          📱 手機用戶請直接點選「奉香簽到」 | 💻 管理者請點選「管理後台」
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto px-4">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Link key={service.href} href={service.href} data-testid={`link-${service.href.replace(/\//g, '-')}`}>
              <Card className={`h-full hover-elevate active-elevate-2 transition-all cursor-pointer ${
                service.primary ? 'border-2 border-orange-600' : ''
              }`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-semibold" data-testid={`title-${service.href.replace(/\//g, '-')}`}>
                    {service.title}
                  </CardTitle>
                  <Icon className={`h-6 w-6 ${service.color}`} />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base" data-testid={`desc-${service.href.replace(/\//g, '-')}`}>
                    {service.description}
                  </CardDescription>
                  <Button 
                    className="mt-4 w-full" 
                    variant={service.primary ? "default" : "outline"}
                    data-testid={`button-goto-${service.href.replace(/\//g, '-')}`}
                  >
                    {service.primary ? '立即簽到' : '前往'}
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

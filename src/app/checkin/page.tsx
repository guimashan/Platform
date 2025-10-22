"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import ErrorAlert from "@/components/ui/error-alert";
import EmptyState from "@/components/ui/empty-state";
import { CheckCircle, ArrowLeft } from "lucide-react";
import type { CheckIn, InsertCheckIn } from "@/shared/schema";

export default function CheckinPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<InsertCheckIn>({
    userId: "",
    userName: "",
    type: "visitor",
    location: "龜馬山",
  });

  const { data: checkins, isLoading, error } = useQuery<CheckIn[]>({
    queryKey: ["/api/checkins"],
  });

  const createCheckin = useMutation({
    mutationFn: (data: InsertCheckIn) =>
      apiRequest<CheckIn>("POST", "/api/checkins", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkins"] });
      setShowForm(false);
      setFormData({
        userId: "",
        userName: "",
        type: "visitor",
        location: "龜馬山",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userName.trim()) return;
    createCheckin.mutate(formData);
  };

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">奉香簽到系統</h1>
            <p className="text-sm text-muted-foreground">志工與信眾快速簽到</p>
          </div>
        </div>

        {!showForm ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>簽到記錄</CardTitle>
                  <CardDescription>查看最近的簽到紀錄</CardDescription>
                </div>
                <Button
                  onClick={() => setShowForm(true)}
                  data-testid="button-show-form"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  我要簽到
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && <Spinner label="載入中..." />}
              {error && <ErrorAlert message="載入簽到記錄失敗" />}
              
              {!isLoading && !error && checkins && checkins.length === 0 && (
                <EmptyState
                  title="目前沒有簽到資料"
                  hint="點擊「我要簽到」按鈕開始記錄"
                />
              )}

              {!isLoading && !error && checkins && checkins.length > 0 && (
                <div className="space-y-3">
                  {checkins.map((checkin) => (
                    <div
                      key={checkin.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                      data-testid={`checkin-item-${checkin.id}`}
                    >
                      <div>
                        <p className="font-medium" data-testid={`checkin-name-${checkin.id}`}>
                          {checkin.userName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {checkin.location} · {new Date(checkin.timestamp).toLocaleString("zh-TW")}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {checkin.type === "volunteer" && "志工"}
                        {checkin.type === "visitor" && "訪客"}
                        {checkin.type === "member" && "會員"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>簽到表單</CardTitle>
              <CardDescription>請填寫您的資訊進行簽到</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">姓名 *</Label>
                  <Input
                    id="userName"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    placeholder="請輸入您的姓名"
                    required
                    data-testid="input-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">身份類別</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visitor">訪客</SelectItem>
                      <SelectItem value="member">會員</SelectItem>
                      <SelectItem value="volunteer">志工</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">地點</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="簽到地點"
                    data-testid="input-location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">備註</Label>
                  <Input
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="其他備註（選填）"
                    data-testid="input-notes"
                  />
                </div>

                {createCheckin.error && (
                  <ErrorAlert message="簽到失敗，請稍後再試" />
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                    disabled={createCheckin.isPending}
                    data-testid="button-cancel"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createCheckin.isPending || !formData.userName.trim()}
                    data-testid="button-submit-checkin"
                  >
                    {createCheckin.isPending ? "處理中..." : "確認簽到"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

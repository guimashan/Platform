import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/ui/spinner";
import ErrorAlert from "@/components/ui/error-alert";
import EmptyState from "@/components/ui/empty-state";
import { CalendarPlus, ArrowLeft } from "lucide-react";
import type { Schedule, InsertSchedule } from "@shared/schema";

export default function SchedulePage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<InsertSchedule>({
    userId: "",
    userName: "",
    date: new Date().toISOString().split("T")[0],
    shift: "morning",
    role: "",
  });

  const { data: schedules, isLoading, error } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  const createSchedule = useMutation({
    mutationFn: (data: InsertSchedule) =>
      apiRequest<Schedule>("POST", "/api/schedules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setShowForm(false);
      setFormData({
        userId: "",
        userName: "",
        date: new Date().toISOString().split("T")[0],
        shift: "morning",
        role: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userName.trim()) return;
    createSchedule.mutate(formData);
  };

  const getStatusBadge = (status: Schedule["status"]) => {
    const variants = {
      scheduled: { label: "已排班", variant: "secondary" as const },
      confirmed: { label: "已確認", variant: "default" as const },
      completed: { label: "已完成", variant: "outline" as const },
      cancelled: { label: "已取消", variant: "destructive" as const },
    };
    const { label, variant } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getShiftLabel = (shift: Schedule["shift"]) => {
    const labels = {
      morning: "早班 (08:00-12:00)",
      afternoon: "午班 (12:00-17:00)",
      evening: "晚班 (17:00-21:00)",
      night: "夜班 (21:00-08:00)",
    };
    return labels[shift];
  };

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">志工排班系統</h1>
            <p className="text-sm text-muted-foreground">班表管理與換班</p>
          </div>
        </div>

        {!showForm ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>排班記錄</CardTitle>
                  <CardDescription>查看志工排班表</CardDescription>
                </div>
                <Button
                  onClick={() => setShowForm(true)}
                  data-testid="button-show-form"
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  新增排班
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && <Spinner label="載入中..." />}
              {error && <ErrorAlert message="載入排班資料失敗" />}
              
              {!isLoading && !error && schedules && schedules.length === 0 && (
                <EmptyState
                  title="目前沒有排班資料"
                  hint="點擊「新增排班」按鈕開始安排班表"
                />
              )}

              {!isLoading && !error && schedules && schedules.length > 0 && (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-4 rounded-lg border hover-elevate space-y-2"
                      data-testid={`schedule-item-${schedule.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium" data-testid={`schedule-name-${schedule.id}`}>
                              {schedule.userName}
                            </h3>
                            {getStatusBadge(schedule.status)}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              <span className="font-medium">日期：</span>
                              {new Date(schedule.date).toLocaleDateString("zh-TW")}
                            </p>
                            <p>
                              <span className="font-medium">班別：</span>
                              {getShiftLabel(schedule.shift)}
                            </p>
                            {schedule.role && (
                              <p>
                                <span className="font-medium">職務：</span>
                                {schedule.role}
                              </p>
                            )}
                            {schedule.notes && (
                              <p>
                                <span className="font-medium">備註：</span>
                                {schedule.notes}
                              </p>
                            )}
                          </div>
                        </div>
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
              <CardTitle>排班表單</CardTitle>
              <CardDescription>請填寫排班資訊</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">志工姓名 *</Label>
                  <Input
                    id="userName"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    placeholder="請輸入志工姓名"
                    required
                    data-testid="input-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">日期 *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    data-testid="input-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift">班別 *</Label>
                  <Select
                    value={formData.shift}
                    onValueChange={(value: any) => setFormData({ ...formData, shift: value })}
                  >
                    <SelectTrigger data-testid="select-shift">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">早班 (08:00-12:00)</SelectItem>
                      <SelectItem value="afternoon">午班 (12:00-17:00)</SelectItem>
                      <SelectItem value="evening">晚班 (17:00-21:00)</SelectItem>
                      <SelectItem value="night">夜班 (21:00-08:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">職務</Label>
                  <Input
                    id="role"
                    value={formData.role || ""}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="例如：接待、清潔、行政"
                    data-testid="input-role"
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

                {createSchedule.error && (
                  <ErrorAlert message="新增排班失敗，請稍後再試" />
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                    disabled={createSchedule.isPending}
                    data-testid="button-cancel"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createSchedule.isPending || !formData.userName.trim()}
                    data-testid="button-submit-schedule"
                  >
                    {createSchedule.isPending ? "處理中..." : "確認排班"}
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

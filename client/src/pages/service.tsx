import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/ui/spinner";
import ErrorAlert from "@/components/ui/error-alert";
import EmptyState from "@/components/ui/empty-state";
import { Plus, ArrowLeft } from "lucide-react";
import type { Service, InsertService } from "@shared/schema";

export default function ServicePage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<InsertService>({
    userId: "",
    userName: "",
    serviceType: "prayer",
    title: "",
    description: "",
  });

  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const createService = useMutation({
    mutationFn: (data: InsertService) =>
      apiRequest<Service>("POST", "/api/services", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setShowForm(false);
      setFormData({
        userId: "",
        userName: "",
        serviceType: "prayer",
        title: "",
        description: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userName.trim() || !formData.title.trim()) return;
    createService.mutate(formData);
  };

  const getStatusBadge = (status: Service["status"]) => {
    const variants = {
      pending: { label: "待處理", variant: "secondary" as const },
      approved: { label: "已核准", variant: "default" as const },
      completed: { label: "已完成", variant: "outline" as const },
      cancelled: { label: "已取消", variant: "destructive" as const },
    };
    const { label, variant } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getServiceTypeLabel = (type: Service["serviceType"]) => {
    const labels = {
      prayer: "祈福",
      donation: "捐獻",
      ceremony: "法會",
      consultation: "諮詢",
      other: "其他",
    };
    return labels[type];
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
            <h1 className="text-3xl font-bold" data-testid="text-page-title">神務服務</h1>
            <p className="text-sm text-muted-foreground">服務申請與查詢</p>
          </div>
        </div>

        {!showForm ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>服務申請紀錄</CardTitle>
                  <CardDescription>查看您的服務申請狀態</CardDescription>
                </div>
                <Button
                  onClick={() => setShowForm(true)}
                  data-testid="button-show-form"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增申請
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && <Spinner label="載入中..." />}
              {error && <ErrorAlert message="載入服務紀錄失敗" />}
              
              {!isLoading && !error && services && services.length === 0 && (
                <EmptyState
                  title="目前沒有服務申請"
                  hint="點擊「新增申請」按鈕提出服務需求"
                />
              )}

              {!isLoading && !error && services && services.length > 0 && (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 rounded-lg border hover-elevate space-y-2"
                      data-testid={`service-item-${service.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium" data-testid={`service-title-${service.id}`}>
                              {service.title}
                            </h3>
                            {getStatusBadge(service.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{getServiceTypeLabel(service.serviceType)}</span>
                            <span>申請人：{service.userName}</span>
                            <span>{new Date(service.createdAt).toLocaleDateString("zh-TW")}</span>
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
              <CardTitle>服務申請表單</CardTitle>
              <CardDescription>請填寫您的服務需求</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">申請人姓名 *</Label>
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
                  <Label htmlFor="serviceType">服務類型 *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value: any) => setFormData({ ...formData, serviceType: value })}
                  >
                    <SelectTrigger data-testid="select-service-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prayer">祈福</SelectItem>
                      <SelectItem value="donation">捐獻</SelectItem>
                      <SelectItem value="ceremony">法會</SelectItem>
                      <SelectItem value="consultation">諮詢</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">服務標題 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="簡短描述您的需求"
                    required
                    data-testid="input-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">詳細說明 *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="請詳細說明您的服務需求"
                    rows={4}
                    required
                    data-testid="input-description"
                  />
                </div>

                {createService.error && (
                  <ErrorAlert message="提交申請失敗，請稍後再試" />
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                    disabled={createService.isPending}
                    data-testid="button-cancel"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createService.isPending || !formData.userName.trim() || !formData.title.trim()}
                    data-testid="button-submit-service"
                  >
                    {createService.isPending ? "處理中..." : "提交申請"}
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

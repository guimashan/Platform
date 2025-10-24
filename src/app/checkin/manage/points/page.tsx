"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { platformAuth } from "@/lib/firebase-platform";
import { MapPin, Plus, Edit2, Trash2, ArrowLeft, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface PatrolPoint {
  id: string;
  name: string;
  qr: string;
  lat: number;
  lng: number;
  tolerance: number;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

// Zod schema 驗證
const patrolPointSchema = z.object({
  name: z.string().min(1, "巡邏點名稱不可為空"),
  qr: z.string().min(1, "QR Code 不可為空"),
  lat: z.coerce.number().min(-90).max(90, "緯度必須在 -90 到 90 之間"),
  lng: z.coerce.number().min(-180).max(180, "經度必須在 -180 到 180 之間"),
  tolerance: z.coerce.number().min(1, "容許誤差必須大於 0"),
  active: z.boolean(),
});

type PatrolPointFormData = z.infer<typeof patrolPointSchema>;

export default function PatrolPointsManagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<PatrolPoint[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState(true);
  
  // 編輯狀態
  const [editingPoint, setEditingPoint] = useState<PatrolPoint | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // 新增狀態
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // 新增表單
  const addForm = useForm<PatrolPointFormData>({
    resolver: zodResolver(patrolPointSchema),
    defaultValues: {
      name: "",
      qr: "",
      lat: 0,
      lng: 0,
      tolerance: 50,
      active: true,
    },
  });

  // 編輯表單
  const editForm = useForm<PatrolPointFormData>({
    resolver: zodResolver(patrolPointSchema),
    defaultValues: {
      name: "",
      qr: "",
      lat: 0,
      lng: 0,
      tolerance: 50,
      active: true,
    },
  });

  useEffect(() => {
    const unsubscribe = platformAuth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }

      setCurrentUser(user);
      await fetchPoints(user);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchPoints = async (user: any) => {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/checkin/points/manage", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      
      if (res.status === 403) {
        setHasPermission(false);
        toast({
          variant: "destructive",
          title: "權限不足",
          description: "您沒有權限訪問此頁面",
        });
        return;
      }
      
      const data = await res.json();
      
      if (res.ok) {
        setPoints(data.patrols || []);
      } else {
        toast({
          variant: "destructive",
          title: "載入失敗",
          description: data.error || "無法載入巡邏點資料",
        });
      }
    } catch (error) {
      console.error("載入巡邏點失敗:", error);
      toast({
        variant: "destructive",
        title: "載入錯誤",
        description: "無法連接到伺服器",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data: PatrolPointFormData) => {
    if (!currentUser) return;

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/checkin/points/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();
      if (res.ok) {
        toast({
          title: "新增成功",
          description: `巡邏點「${data.name}」已建立`,
        });
        setAddDialogOpen(false);
        addForm.reset();
        await fetchPoints(currentUser);
      } else {
        toast({
          variant: "destructive",
          title: "新增失敗",
          description: responseData.error || "無法新增巡邏點",
        });
      }
    } catch (error) {
      console.error("新增巡邏點失敗:", error);
      toast({
        variant: "destructive",
        title: "新增錯誤",
        description: "無法連接到伺服器",
      });
    }
  };

  const startEdit = (point: PatrolPoint) => {
    setEditingPoint(point);
    editForm.reset({
      name: point.name,
      qr: point.qr,
      lat: point.lat,
      lng: point.lng,
      tolerance: point.tolerance,
      active: point.active,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async (data: PatrolPointFormData) => {
    if (!currentUser || !editingPoint) return;

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/checkin/points/manage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          patrolId: editingPoint.id,
          ...data,
        }),
      });

      const responseData = await res.json();
      if (res.ok) {
        toast({
          title: "更新成功",
          description: "巡邏點資料已更新",
        });
        setEditDialogOpen(false);
        setEditingPoint(null);
        await fetchPoints(currentUser);
      } else {
        toast({
          variant: "destructive",
          title: "更新失敗",
          description: responseData.error || "無法更新巡邏點",
        });
      }
    } catch (error) {
      console.error("更新巡邏點失敗:", error);
      toast({
        variant: "destructive",
        title: "更新錯誤",
        description: "無法連接到伺服器",
      });
    }
  };

  const handleDelete = async (patrolId: string, name: string) => {
    if (!currentUser) return;

    if (!confirm(`確定要刪除巡邏點「${name}」嗎？`)) {
      return;
    }

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`/api/checkin/points/manage?patrolId=${patrolId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: "刪除成功",
          description: `巡邏點「${name}」已刪除`,
        });
        await fetchPoints(currentUser);
      } else {
        toast({
          variant: "destructive",
          title: "刪除失敗",
          description: data.error || "無法刪除巡邏點",
        });
      }
    } catch (error) {
      console.error("刪除巡邏點失敗:", error);
      toast({
        variant: "destructive",
        title: "刪除錯誤",
        description: "無法連接到伺服器",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600" data-testid="text-loading">載入中...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle data-testid="text-permission-denied">權限不足</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4" data-testid="text-permission-message">
              您沒有權限訪問巡邏點管理功能
            </p>
            <Button onClick={() => router.push("/checkin/manage")} data-testid="button-back-permission">
              返回管理中心
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/checkin/manage")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回簽到管理
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2" data-testid="text-page-title">
                巡邏點管理
              </h1>
              <p className="text-gray-600" data-testid="text-page-description">
                管理巡邏點的 GPS 座標與 QR Code
              </p>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              data-testid="button-add-point"
            >
              <Plus className="w-5 h-5 mr-2" />
              新增巡邏點
            </Button>
          </div>
        </div>

        {/* 巡邏點列表 */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-table-title">巡邏點列表</CardTitle>
          </CardHeader>
          <CardContent>
            {points.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4" data-testid="text-empty-state">
                  目前沒有巡邏點資料
                </p>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  data-testid="button-add-first-point"
                >
                  建立第一個巡邏點
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="header-name">名稱</TableHead>
                    <TableHead data-testid="header-qr">QR Code</TableHead>
                    <TableHead className="text-center" data-testid="header-gps">GPS 座標</TableHead>
                    <TableHead className="text-center" data-testid="header-tolerance">容許誤差</TableHead>
                    <TableHead className="text-center" data-testid="header-status">狀態</TableHead>
                    <TableHead className="text-center" data-testid="header-actions">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {points.map((point) => (
                    <TableRow
                      key={point.id}
                      data-testid={`row-point-${point.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-orange-600" />
                          <span className="font-medium" data-testid={`text-name-${point.id}`}>
                            {point.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded" data-testid={`text-qr-${point.id}`}>
                          {point.qr}
                        </code>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="text-gray-600">
                          <div data-testid={`text-lat-${point.id}`}>{point.lat.toFixed(6)}</div>
                          <div data-testid={`text-lng-${point.id}`}>{point.lng.toFixed(6)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-gray-700" data-testid={`text-tolerance-${point.id}`}>
                          {point.tolerance} m
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={point.active ? "default" : "secondary"}
                          data-testid={`badge-status-${point.id}`}
                        >
                          {point.active ? "啟用" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(point)}
                            data-testid={`button-edit-${point.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(point.id, point.name)}
                            data-testid={`button-delete-${point.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 說明 */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2" data-testid="text-help-title">
              <Lightbulb className="w-5 h-5" />
              使用說明
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p data-testid="text-help-gps">
              <strong>GPS 座標</strong>：可使用 Google Maps 查詢（點擊位置 → 座標會顯示在下方）
            </p>
            <p data-testid="text-help-tolerance">
              <strong>容許誤差</strong>：建議設定 30-50 公尺，室內可設定較小值
            </p>
            <p data-testid="text-help-qr">
              <strong>QR Code</strong>：建議使用 PATROL_XXX 格式，便於管理
            </p>
            <p data-testid="text-help-status">
              <strong>啟用/停用</strong>：停用的巡邏點不會出現在簽到選項中
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 新增對話框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent data-testid="dialog-add-point">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-add-title">新增巡邏點</DialogTitle>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>巡邏點名稱</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：玉旨牌" data-testid="input-add-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="qr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QR Code</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：PATROL_YUJI" data-testid="input-add-qr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>緯度</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" placeholder="25.147924" data-testid="input-add-lat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>經度</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" placeholder="121.410296" data-testid="input-add-lng" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="tolerance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>容許誤差（公尺）</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" data-testid="input-add-tolerance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4"
                        data-testid="checkbox-add-active"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">啟用此巡邏點</FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  data-testid="button-cancel-add"
                >
                  取消
                </Button>
                <Button type="submit" data-testid="button-confirm-add">
                  確認新增
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 編輯對話框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-point">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-edit-title">編輯巡邏點</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>巡邏點名稱</FormLabel>
                    <FormControl>
                      <Input data-testid="input-edit-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="qr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QR Code</FormLabel>
                    <FormControl>
                      <Input data-testid="input-edit-qr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>緯度</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" data-testid="input-edit-lat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>經度</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" data-testid="input-edit-lng" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="tolerance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>容許誤差（公尺）</FormLabel>
                    <FormControl>
                      <Input type="number" data-testid="input-edit-tolerance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4"
                        data-testid="checkbox-edit-active"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">啟用此巡邏點</FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  取消
                </Button>
                <Button type="submit" data-testid="button-confirm-edit">
                  儲存變更
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

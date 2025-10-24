"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Plus,
  MapPin,
  QrCode,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import QRCode from "react-qr-code";

export const dynamic = "force-dynamic";

interface Patrol {
  id: string;
  name: string;
  qr: string;
  active: boolean;
  createdAt: number;
}

export default function PatrolPointsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<Patrol[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<Patrol | null>(null);
  const [selectedQR, setSelectedQR] = useState<{ name: string; qr: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", qr: "" });

  useEffect(() => {
    const unsubscribe = authClient.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/admin/login");
      } else {
        setUser(currentUser);
        fetchPoints(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchPoints = async (currentUser: any) => {
    try {
      setLoading(true);
      const response = await fetch("/api/checkin/points");

      if (response.ok) {
        const data = await response.json();
        setPoints(data.points || []);
      }
    } catch (error) {
      console.error("載入巡邏點錯誤:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !formData.name || !formData.qr) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/checkin/points/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        setFormData({ name: "", qr: "" });
        fetchPoints(user);
      } else {
        const error = await response.json();
        alert(error.error || "新增失敗");
      }
    } catch (error) {
      console.error("新增巡邏點錯誤:", error);
      alert("新增失敗");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Patrol>) => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/checkin/points/manage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        fetchPoints(user);
      }
    } catch (error) {
      console.error("更新巡邏點錯誤:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("確定要刪除此巡邏點嗎？")) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/checkin/points/manage?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        fetchPoints(user);
      }
    } catch (error) {
      console.error("刪除巡邏點錯誤:", error);
    }
  };

  const handleDownloadQR = (name: string, qrContent: string) => {
    const svg = document.getElementById(`qr-${qrContent}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${name}-QR.png`;
          link.click();
        }
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                巡邏點管理
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                共 {points.length} 個巡邏點
              </p>
            </div>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            data-testid="button-add-point"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增巡邏點
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {points.map((point) => (
            <Card key={point.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{point.name}</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">
                        {point.qr}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      point.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {point.active ? "啟用" : "停用"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedQR({ name: point.name, qr: point.qr });
                      setQrDialogOpen(true);
                    }}
                    data-testid={`button-show-qr-${point.id}`}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Code
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdate(point.id, { active: !point.active })}
                    data-testid={`button-toggle-${point.id}`}
                  >
                    {point.active ? "停用" : "啟用"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(point.id)}
                    data-testid={`button-delete-${point.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 新增/編輯對話框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增巡邏點</DialogTitle>
            <DialogDescription>
              請輸入巡邏點名稱和 QR Code 內容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">名稱</label>
              <Input
                placeholder="例如：玉旨牌"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-point-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">QR Code</label>
              <Input
                placeholder="例如：PATROL_YUJI"
                value={formData.qr}
                onChange={(e) => setFormData({ ...formData, qr: e.target.value })}
                data-testid="input-point-qr"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} data-testid="button-confirm-create">
              確認新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code 顯示對話框 */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedQR?.name} - QR Code</DialogTitle>
            <DialogDescription>
              掃描此 QR Code 即可在 {selectedQR?.name} 簽到
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 space-y-4">
            {selectedQR && (
              <QRCode 
                id={`qr-${selectedQR.qr}`}
                value={selectedQR.qr} 
                size={256}
                level="H"
              />
            )}
            <p className="text-sm text-gray-600 font-mono">
              {selectedQR?.qr}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedQR) {
                  handleDownloadQR(selectedQR.name, selectedQR.qr);
                }
              }}
              data-testid="button-download-qr"
            >
              <Download className="w-4 h-4 mr-2" />
              下載 QR Code
            </Button>
            <Button onClick={() => setQrDialogOpen(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

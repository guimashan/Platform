"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { platformAuth } from "@/lib/firebase-platform";
import { MapPin, Plus, Edit2, Trash2, Save, X } from "lucide-react";

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

export default function PatrolPointsManagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<PatrolPoint[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 編輯狀態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PatrolPoint>>({});
  
  // 新增狀態
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    qr: "",
    lat: "",
    lng: "",
    tolerance: "50",
    active: true,
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
      const data = await res.json();
      
      if (res.ok) {
        setPoints(data.patrols || []);
      } else {
        alert(`載入失敗: ${data.error}`);
      }
    } catch (error) {
      console.error("載入巡邏點失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!currentUser) return;
    
    if (!addForm.name || !addForm.qr || !addForm.lat || !addForm.lng) {
      alert("請填寫所有必要欄位");
      return;
    }

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/checkin/points/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (res.ok) {
        alert("新增成功");
        setShowAddForm(false);
        setAddForm({
          name: "",
          qr: "",
          lat: "",
          lng: "",
          tolerance: "50",
          active: true,
        });
        await fetchPoints(currentUser);
      } else {
        alert(`新增失敗: ${data.error}`);
      }
    } catch (error) {
      console.error("新增巡邏點失敗:", error);
      alert("新增巡邏點失敗");
    }
  };

  const startEdit = (point: PatrolPoint) => {
    setEditingId(point.id);
    setEditForm({
      name: point.name,
      qr: point.qr,
      lat: point.lat,
      lng: point.lng,
      tolerance: point.tolerance,
      active: point.active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (patrolId: string) => {
    if (!currentUser) return;

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/checkin/points/manage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          patrolId,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("更新成功");
        setEditingId(null);
        await fetchPoints(currentUser);
      } else {
        alert(`更新失敗: ${data.error}`);
      }
    } catch (error) {
      console.error("更新巡邏點失敗:", error);
      alert("更新巡邏點失敗");
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
        alert("刪除成功");
        await fetchPoints(currentUser);
      } else {
        alert(`刪除失敗: ${data.error}`);
      }
    } catch (error) {
      console.error("刪除巡邏點失敗:", error);
      alert("刪除巡邏點失敗");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/checkin/manage")}
            className="mb-4 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            data-testid="button-back"
          >
            ← 返回簽到管理
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">巡邏點管理</h1>
              <p className="text-gray-600">管理巡邏點的 GPS 座標與 QR Code</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              data-testid="button-add-point"
            >
              <Plus className="w-5 h-5" />
              新增巡邏點
            </button>
          </div>
        </div>

        {/* 新增表單 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">新增巡邏點</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    巡邏點名稱 *
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-600"
                    placeholder="例如：玉旨牌"
                    data-testid="input-add-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code *
                  </label>
                  <input
                    type="text"
                    value={addForm.qr}
                    onChange={(e) => setAddForm({ ...addForm, qr: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-600"
                    placeholder="例如：PATROL_YUJI"
                    data-testid="input-add-qr"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      緯度 (Latitude) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={addForm.lat}
                      onChange={(e) => setAddForm({ ...addForm, lat: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-600"
                      placeholder="25.147924"
                      data-testid="input-add-lat"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      經度 (Longitude) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={addForm.lng}
                      onChange={(e) => setAddForm({ ...addForm, lng: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-600"
                      placeholder="121.410296"
                      data-testid="input-add-lng"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    容許誤差（公尺）
                  </label>
                  <input
                    type="number"
                    value={addForm.tolerance}
                    onChange={(e) => setAddForm({ ...addForm, tolerance: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-600"
                    placeholder="50"
                    data-testid="input-add-tolerance"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addForm.active}
                    onChange={(e) => setAddForm({ ...addForm, active: e.target.checked })}
                    className="w-4 h-4"
                    data-testid="checkbox-add-active"
                  />
                  <label className="text-sm text-gray-700">啟用此巡邏點</label>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleAdd}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  data-testid="button-confirm-add"
                >
                  確認新增
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                  data-testid="button-cancel-add"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 巡邏點列表 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">名稱</th>
                <th className="px-4 py-3 text-left">QR Code</th>
                <th className="px-4 py-3 text-center">GPS 座標</th>
                <th className="px-4 py-3 text-center">容許誤差</th>
                <th className="px-4 py-3 text-center">狀態</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr
                  key={point.id}
                  className="border-b hover:bg-orange-50 transition-colors"
                  data-testid={`row-point-${point.id}`}
                >
                  <td className="px-4 py-3">
                    {editingId === point.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                        data-testid={`input-edit-name-${point.id}`}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-orange-600" />
                        <span className="font-medium">{point.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === point.id ? (
                      <input
                        type="text"
                        value={editForm.qr}
                        onChange={(e) => setEditForm({ ...editForm, qr: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                        data-testid={`input-edit-qr-${point.id}`}
                      />
                    ) : (
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{point.qr}</code>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {editingId === point.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.000001"
                          value={editForm.lat}
                          onChange={(e) => setEditForm({ ...editForm, lat: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 border rounded"
                          placeholder="Lat"
                          data-testid={`input-edit-lat-${point.id}`}
                        />
                        <input
                          type="number"
                          step="0.000001"
                          value={editForm.lng}
                          onChange={(e) => setEditForm({ ...editForm, lng: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 border rounded"
                          placeholder="Lng"
                          data-testid={`input-edit-lng-${point.id}`}
                        />
                      </div>
                    ) : (
                      <div className="text-gray-600">
                        <div>{point.lat.toFixed(6)}</div>
                        <div>{point.lng.toFixed(6)}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === point.id ? (
                      <input
                        type="number"
                        value={editForm.tolerance}
                        onChange={(e) => setEditForm({ ...editForm, tolerance: parseInt(e.target.value) })}
                        className="w-20 px-2 py-1 border rounded mx-auto"
                        data-testid={`input-edit-tolerance-${point.id}`}
                      />
                    ) : (
                      <span className="text-gray-700">{point.tolerance} m</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === point.id ? (
                      <input
                        type="checkbox"
                        checked={editForm.active}
                        onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                        className="w-4 h-4"
                        data-testid={`checkbox-edit-active-${point.id}`}
                      />
                    ) : (
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          point.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {point.active ? "啟用" : "停用"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === point.id ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => saveEdit(point.id)}
                          className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                          data-testid={`button-save-${point.id}`}
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                          data-testid={`button-cancel-edit-${point.id}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => startEdit(point)}
                          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          data-testid={`button-edit-${point.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(point.id, point.name)}
                          className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                          data-testid={`button-delete-${point.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {points.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              目前沒有巡邏點資料
              <div className="mt-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  建立第一個巡邏點
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 說明 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 使用說明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>GPS 座標</strong>：可使用 Google Maps 查詢（點擊位置 → 座標會顯示在下方）</li>
            <li><strong>容許誤差</strong>：建議設定 30-50 公尺，室內可設定較小值</li>
            <li><strong>QR Code</strong>：建議使用 PATROL_XXX 格式，便於管理</li>
            <li><strong>啟用/停用</strong>：停用的巡邏點不會出現在簽到選項中</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { platformAuth } from "@/lib/firebase-platform";
import type { UserDoc } from "@/types";

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<(UserDoc & { id: string; checkinCount: number })[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<"all" | "checkin" | "schedule" | "service">("all");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{
    checkin?: string;
    schedule?: string;
    service?: string;
  }>({});

  useEffect(() => {
    const unsubscribe = platformAuth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }

      setCurrentUser(user);
      const idToken = await user.getIdToken();
      const userDocRes = await fetch(`/api/profile?uid=${user.uid}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const userDocData = await userDocRes.json();
      setIsSuperAdmin(userDocData.user?.isSuperAdmin === true);

      if (userDocData.user?.isSuperAdmin !== true) {
        alert("只有 SuperAdmin 可以訪問總管理中心");
        router.push("/admin");
        return;
      }

      fetchUsers(idToken);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUsers = async (idToken: string) => {
    try {
      const params = selectedSystem !== "all" ? `?system=${selectedSystem}` : "";
      const res = await fetch(`/api/users/list${params}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        alert(`載入失敗: ${data.error}`);
      }
    } catch (error) {
      console.error("載入使用者失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUid: string, system: string, newRole: string) => {
    if (!currentUser) return;

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetUid,
          system,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchUsers(idToken);
        setEditingUser(null);
      } else {
        alert(`設定失敗: ${data.error}`);
      }
    } catch (error) {
      console.error("設定角色失敗:", error);
      alert("設定角色失敗");
    }
  };

  const startEdit = (user: UserDoc & { id: string }) => {
    setEditingUser(user.id);
    setEditingRole({
      checkin: user.checkin_role || "user",
      schedule: user.schedule_role || "user",
      service: user.service_role || "user",
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditingRole({});
  };

  const saveEdit = async (userId: string) => {
    if (!currentUser) return;

    try {
      const idToken = await currentUser.getIdToken();
      
      const promises = [];
      if (editingRole.checkin) {
        promises.push(
          fetch("/api/users/role", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              targetUid: userId,
              system: "checkin",
              role: editingRole.checkin,
            }),
          })
        );
      }
      if (editingRole.schedule) {
        promises.push(
          fetch("/api/users/role", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              targetUid: userId,
              system: "schedule",
              role: editingRole.schedule,
            }),
          })
        );
      }
      if (editingRole.service) {
        promises.push(
          fetch("/api/users/role", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              targetUid: userId,
              system: "service",
              role: editingRole.service,
            }),
          })
        );
      }

      await Promise.all(promises);
      alert("角色設定成功");
      fetchUsers(idToken);
      setEditingUser(null);
    } catch (error) {
      console.error("儲存角色失敗:", error);
      alert("儲存角色失敗");
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
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin")}
            className="mb-4 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            data-testid="button-back"
          >
            ← 返回管理中心
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">總管理中心 - 使用者管理</h1>
          <p className="text-gray-600">SuperAdmin 可管理所有系統的使用者角色</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => {
                setSelectedSystem("all");
                if (currentUser) fetchUsers(currentUser.getIdToken());
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedSystem === "all"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              data-testid="button-filter-all"
            >
              所有使用者
            </button>
            <button
              onClick={() => {
                setSelectedSystem("checkin");
                if (currentUser) fetchUsers(currentUser.getIdToken());
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedSystem === "checkin"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              data-testid="button-filter-checkin"
            >
              奉香簽到
            </button>
            <button
              onClick={() => {
                setSelectedSystem("schedule");
                if (currentUser) fetchUsers(currentUser.getIdToken());
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedSystem === "schedule"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              data-testid="button-filter-schedule"
            >
              志工排班
            </button>
            <button
              onClick={() => {
                setSelectedSystem("service");
                if (currentUser) fetchUsers(currentUser.getIdToken());
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedSystem === "service"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              data-testid="button-filter-service"
            >
              神務服務
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">使用者</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">簽到次數</th>
                <th className="px-4 py-3 text-center">奉香簽到</th>
                <th className="px-4 py-3 text-center">志工排班</th>
                <th className="px-4 py-3 text-center">神務服務</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-orange-50 transition-colors"
                  data-testid={`row-user-${user.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.pictureUrl && (
                        <img
                          src={user.pictureUrl}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium">{user.displayName}</div>
                        {user.isSuperAdmin && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            SuperAdmin
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email || "-"}</td>
                  <td className="px-4 py-3 text-center">{user.checkinCount}</td>
                  <td className="px-4 py-3 text-center">
                    {editingUser === user.id ? (
                      <select
                        value={editingRole.checkin || "user"}
                        onChange={(e) =>
                          setEditingRole({ ...editingRole, checkin: e.target.value })
                        }
                        className="px-2 py-1 border rounded"
                        data-testid={`select-checkin-${user.id}`}
                      >
                        <option value="user">user</option>
                        <option value="poweruser">poweruser</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.checkin_role === "admin"
                            ? "bg-red-100 text-red-800"
                            : user.checkin_role === "poweruser"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.checkin_role || "user"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingUser === user.id ? (
                      <select
                        value={editingRole.schedule || "user"}
                        onChange={(e) =>
                          setEditingRole({ ...editingRole, schedule: e.target.value })
                        }
                        className="px-2 py-1 border rounded"
                        data-testid={`select-schedule-${user.id}`}
                      >
                        <option value="user">user</option>
                        <option value="poweruser">poweruser</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.schedule_role === "admin"
                            ? "bg-red-100 text-red-800"
                            : user.schedule_role === "poweruser"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.schedule_role || "user"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingUser === user.id ? (
                      <select
                        value={editingRole.service || "user"}
                        onChange={(e) =>
                          setEditingRole({ ...editingRole, service: e.target.value })
                        }
                        className="px-2 py-1 border rounded"
                        data-testid={`select-service-${user.id}`}
                      >
                        <option value="user">user</option>
                        <option value="poweruser">poweruser</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.service_role === "admin"
                            ? "bg-red-100 text-red-800"
                            : user.service_role === "poweruser"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.service_role || "user"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingUser === user.id ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => saveEdit(user.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          data-testid={`button-save-${user.id}`}
                        >
                          儲存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                          data-testid={`button-cancel-${user.id}`}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(user)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        data-testid={`button-edit-${user.id}`}
                      >
                        編輯
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              目前沒有使用者資料
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

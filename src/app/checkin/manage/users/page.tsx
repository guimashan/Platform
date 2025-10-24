"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/firebase-platform";
import type { UserDoc } from "@/types";

export default function CheckinUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<(UserDoc & { id: string; checkinCount: number })[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckinAdmin, setIsCheckinAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>("user");

  useEffect(() => {
    const unsubscribe = authClient.onAuthStateChanged(async (user) => {
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
      
      const isSuperAdmin = userDocData.user?.isSuperAdmin === true;
      const isAdmin = userDocData.user?.checkin_role === "admin";
      
      setIsCheckinAdmin(isSuperAdmin || isAdmin);

      if (!isSuperAdmin && !isAdmin) {
        alert("需要 checkin admin 或 SuperAdmin 權限");
        router.push("/checkin/manage");
        return;
      }

      fetchUsers(idToken);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUsers = async (idToken: string) => {
    try {
      const res = await fetch("/api/users/list?system=checkin", {
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

  const handleRoleChange = async (targetUid: string, newRole: string) => {
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
          system: "checkin",
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

  const startEdit = (userId: string, currentRole: string) => {
    setEditingUser(userId);
    setEditingRole(currentRole || "user");
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditingRole("user");
  };

  const saveEdit = async (userId: string) => {
    await handleRoleChange(userId, editingRole);
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/checkin/manage")}
            className="mb-4 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            data-testid="button-back"
          >
            ← 返回簽到管理
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">奉香簽到 - 人員管理</h1>
          <p className="text-gray-600">管理奉香簽到系統的使用者角色</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">使用者</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">簽到次數</th>
                <th className="px-4 py-3 text-center">角色</th>
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
                  <td className="px-4 py-3 text-center font-medium">{user.checkinCount}</td>
                  <td className="px-4 py-3 text-center">
                    {editingUser === user.id ? (
                      <select
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        className="px-3 py-1 border rounded"
                        data-testid={`select-role-${user.id}`}
                      >
                        <option value="user">user - 一般使用者</option>
                        <option value="poweruser">poweruser - 免 GPS 簽到</option>
                        <option value="admin">admin - 系統管理員</option>
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
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
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => saveEdit(user.id)}
                          className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          data-testid={`button-save-${user.id}`}
                        >
                          儲存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                          data-testid={`button-cancel-${user.id}`}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(user.id, user.checkin_role || "user")}
                        className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        data-testid={`button-edit-${user.id}`}
                      >
                        編輯角色
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

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">角色說明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>user</strong>: 一般使用者，需要 GPS 定位才能簽到</li>
            <li><strong>poweruser</strong>: 免 GPS 定位簽到，可查看簽到記錄</li>
            <li><strong>admin</strong>: 系統管理員，可管理巡邏點、設定角色</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

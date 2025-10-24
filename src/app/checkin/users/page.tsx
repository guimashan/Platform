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
  Users,
  Shield,
  Search,
  BarChart3,
} from "lucide-react";
import type { UserDoc } from "@/types";

export const dynamic = "force-dynamic";

interface UserWithStats extends UserDoc {
  id: string;
  checkinCount: number;
}

export default function UsersManagePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);

  useEffect(() => {
    const unsubscribe = authClient.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/admin/login");
      } else {
        setUser(currentUser);
        fetchUsers(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async (currentUser: any) => {
    try {
      setLoading(true);
      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/users/list", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }
    } catch (error) {
      console.error("載入使用者錯誤:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoles = async (userId: string, roles: Record<string, boolean>) => {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/users/roles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId, roles }),
      });

      if (response.ok) {
        setRoleDialogOpen(false);
        fetchUsers(user);
      }
    } catch (error) {
      console.error("更新權限錯誤:", error);
    }
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
                人員管理
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                共 {users.length} 位使用者
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* 搜尋 */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="搜尋使用者名稱或 ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-user"
              />
            </div>
          </CardContent>
        </Card>

        {/* 使用者列表 */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-medium text-gray-600">使用者</th>
                    <th className="px-6 py-4 font-medium text-gray-600">LINE ID</th>
                    <th className="px-6 py-4 font-medium text-gray-600">簽到次數</th>
                    <th className="px-6 py-4 font-medium text-gray-600">權限</th>
                    <th className="px-6 py-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr 
                        key={u.id} 
                        className="hover:bg-gray-50"
                        data-testid={`row-user-${u.id}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {u.pictureUrl && (
                              <img
                                src={u.pictureUrl}
                                alt={u.displayName}
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div>
                              <p className="font-medium">{u.displayName}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(u.createdAt).toLocaleDateString("zh-TW")} 加入
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                          {u.lineUserId?.slice(0, 12)}...
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-orange-600" />
                            <span className="font-medium">{u.checkinCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.isSuperAdmin ? (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium inline-flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              超級管理員
                            </span>
                          ) : u.roles?.checkin_admin ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              管理員
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              一般使用者
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u);
                              setRoleDialogOpen(true);
                            }}
                            disabled={u.isSuperAdmin}
                            data-testid={`button-manage-${u.id}`}
                          >
                            管理權限
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        暫無使用者
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 權限管理對話框 */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>管理權限 - {selectedUser?.displayName}</DialogTitle>
            <DialogDescription>
              設定使用者的系統權限
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUser?.roles?.checkin_admin || false}
                onChange={(e) => {
                  if (selectedUser) {
                    setSelectedUser({
                      ...selectedUser,
                      roles: {
                        ...selectedUser.roles,
                        checkin_admin: e.target.checked,
                      },
                    });
                  }
                }}
                className="w-4 h-4"
                data-testid="checkbox-checkin-admin"
              />
              <div>
                <p className="font-medium">簽到系統管理員</p>
                <p className="text-sm text-gray-600">
                  可以管理巡邏點、查看所有簽到記錄
                </p>
              </div>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  handleUpdateRoles(selectedUser.id, selectedUser.roles);
                }
              }}
              data-testid="button-confirm-update-roles"
            >
              確認更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

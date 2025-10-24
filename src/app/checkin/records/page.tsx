"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Download, 
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface CheckinRecord {
  id: string;
  uid: string;
  patrolId: string;
  patrolName: string;
  userName: string;
  timestamp: string;
  ts: number;
}

export default function CheckinRecordsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [pagination, setPagination] = useState({ limit: 20, hasMore: false, nextCursor: null as string | null });
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [cursorsHistory, setCursorsHistory] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatrol, setSelectedPatrol] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const unsubscribe = authClient.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/admin/login");
      } else {
        setUser(currentUser);
        fetchRecords(currentUser, null, true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchRecords = async (currentUser: any, cursor: string | null = null, resetHistory = false) => {
    try {
      setLoading(true);
      const idToken = await currentUser.getIdToken();
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
      });

      if (cursor) params.append("cursor", cursor);
      if (selectedPatrol) params.append("patrolId", selectedPatrol);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/checkin/records?${params}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records);
        setPagination(data.pagination);
        setCurrentCursor(cursor);
        
        if (resetHistory) {
          setCursorsHistory([]);
        }
      }
    } catch (error) {
      console.error("載入記錄錯誤:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvHeaders = ["時間", "使用者", "巡邏點", "使用者ID"];
    const csvRows = records.map((record) => [
      new Date(record.timestamp).toLocaleString("zh-TW"),
      record.userName,
      record.patrolName,
      record.uid,
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `checkin-records-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleSearch = () => {
    if (user) {
      fetchRecords(user, null, true);
    }
  };

  const handleNextPage = () => {
    if (user && pagination.nextCursor) {
      setCursorsHistory([...cursorsHistory, currentCursor || ""]);
      fetchRecords(user, pagination.nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (user && cursorsHistory.length > 0) {
      const prevCursor = cursorsHistory[cursorsHistory.length - 1];
      setCursorsHistory(cursorsHistory.slice(0, -1));
      fetchRecords(user, prevCursor || null);
    }
  };

  if (loading && !records.length) {
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
                簽到記錄
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                顯示 {records.length} 筆記錄
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!records.length}
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            匯出 CSV
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* 篩選區塊 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">進階篩選</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  開始日期
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  結束日期
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button
                  onClick={handleSearch}
                  className="w-full"
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  查詢
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 記錄表格 */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-medium text-gray-600">時間</th>
                    <th className="px-6 py-4 font-medium text-gray-600">使用者</th>
                    <th className="px-6 py-4 font-medium text-gray-600">巡邏點</th>
                    <th className="px-6 py-4 font-medium text-gray-600">使用者 ID</th>
                    <th className="px-6 py-4 font-medium text-gray-600">狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.length > 0 ? (
                    records.map((record) => (
                      <tr 
                        key={record.id} 
                        className="hover:bg-gray-50"
                        data-testid={`row-record-${record.id}`}
                      >
                        <td className="px-6 py-4">
                          {new Date(record.timestamp).toLocaleString("zh-TW", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 font-medium">{record.userName}</td>
                        <td className="px-6 py-4">{record.patrolName}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                          {record.uid.slice(0, 12)}...
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            成功
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        暫無簽到記錄
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 分頁 */}
            {(cursorsHistory.length > 0 || pagination.hasMore) && (
              <div className="border-t px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {pagination.hasMore ? "還有更多記錄" : "已到最後一頁"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={cursorsHistory.length === 0}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    上一頁
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!pagination.hasMore}
                    data-testid="button-next-page"
                  >
                    下一頁
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

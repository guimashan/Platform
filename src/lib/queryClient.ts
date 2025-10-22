import { QueryClient, QueryFunction } from "@tanstack/react-query";

// 默認的查詢函數
const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  const url = queryKey.join("/");
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`${response.status}: ${errorText}`);
  }

  return response.json();
};

// API 請求輔助函數（用於 mutations）
export async function apiRequest<T = any>(
  method: string,
  url: string,
  body?: any
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `請求失敗: ${response.statusText}`);
  }

  return response.json();
}

// 創建 QueryClient 實例
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

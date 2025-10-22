import { QueryClient } from "@tanstack/react-query";
import { apiRequest } from "./apiRequest";

// 導出 apiRequest 供頁面使用
export { apiRequest };

// 創建 QueryClient 實例
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

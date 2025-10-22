// API 請求輔助函數（Next.js 版本）

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

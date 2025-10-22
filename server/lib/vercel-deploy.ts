/**
 * Vercel 部署管理模組
 * 功能：
 * 1. 觸發 Vercel 部署
 * 2. 同步環境變數到 Vercel
 * 3. 查詢部署狀態
 */

const VERCEL_API_BASE = "https://api.vercel.com";

interface VercelDeploymentResponse {
  id: string;
  url: string;
  readyState: string;
  createdAt: number;
}

interface VercelEnvVariable {
  key: string;
  value: string;
  target: ("production" | "preview" | "development")[];
  type: "plain" | "encrypted";
}

/**
 * 取得 Vercel 設定
 */
function getVercelConfig() {
  const token = process.env.VERCEL_ADMIN_API_KEY || process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const orgId = process.env.VERCEL_ORG_ID;

  if (!token || !projectId || !orgId) {
    throw new Error(
      "缺少 Vercel 設定：需要 VERCEL_TOKEN/VERCEL_ADMIN_API_KEY, VERCEL_PROJECT_ID, VERCEL_ORG_ID"
    );
  }

  return { token, projectId, orgId };
}

/**
 * 觸發 Vercel 部署
 * 使用 Deploy Hook URL（需要在 Vercel Dashboard 建立）
 * 
 * 如何建立 Deploy Hook:
 * 1. 前往 Vercel 專案設定 → Git
 * 2. 找到 Deploy Hooks 區塊
 * 3. 點擊 Create Hook
 * 4. 設定名稱和分支（通常是 main）
 * 5. 複製生成的 URL 並設定為環境變數 VERCEL_DEPLOY_HOOK_URL
 */
export async function triggerVercelDeployment(): Promise<any> {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;

  if (!hookUrl) {
    throw new Error(
      "缺少 VERCEL_DEPLOY_HOOK_URL 環境變數。請在 Vercel Dashboard 建立 Deploy Hook 並將 URL 設定為環境變數。\n" +
      "步驟：\n" +
      "1. 前往 https://vercel.com/您的團隊/專案/settings/git\n" +
      "2. 找到 Deploy Hooks 區塊\n" +
      "3. 點擊 Create Hook，設定名稱（如 'Replit'）和分支（通常是 'main'）\n" +
      "4. 複製生成的 URL\n" +
      "5. 在 Replit Secrets 中加入 VERCEL_DEPLOY_HOOK_URL"
    );
  }

  const response = await fetch(hookUrl, {
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`觸發部署失敗: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Deploy Hook 回應格式: { job: { id, state, createdAt } }
  return {
    job: data.job || {},
    message: "部署已觸發，請至 Vercel Dashboard 查看進度",
  };
}

/**
 * 同步環境變數到 Vercel
 * 將 Replit Secrets 同步到 Vercel 專案
 */
export async function syncEnvToVercel(envVars: Record<string, string>): Promise<{ created: number; updated: number; errors: string[] }> {
  const { token, projectId } = getVercelConfig();

  // 先取得現有環境變數（包含 id）
  const existingEnvsRes = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${projectId}/env`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!existingEnvsRes.ok) {
    const errorText = await existingEnvsRes.text();
    throw new Error(`無法取得現有環境變數: ${existingEnvsRes.status} - ${errorText}`);
  }

  const existingData = await existingEnvsRes.json();
  const existingEnvsMap = new Map(
    (existingData.envs || []).map((env: any) => [env.key, env.id])
  );

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  // 批次更新或新增環境變數
  for (const [key, value] of Object.entries(envVars)) {
    try {
      const envPayload: VercelEnvVariable = {
        key,
        value,
        target: ["production", "preview", "development"],
        type: "encrypted",
      };

      const existingId = existingEnvsMap.get(key);

      if (existingId) {
        // 更新現有變數（使用 id 而非 key）
        const updateRes = await fetch(
          `${VERCEL_API_BASE}/v9/projects/${projectId}/env/${existingId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              value: envPayload.value,
              target: envPayload.target,
            }),
          }
        );

        if (!updateRes.ok) {
          const errorText = await updateRes.text();
          errors.push(`更新 ${key} 失敗: ${updateRes.status} - ${errorText}`);
        } else {
          updated++;
        }
      } else {
        // 新增變數
        const createRes = await fetch(
          `${VERCEL_API_BASE}/v10/projects/${projectId}/env`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(envPayload),
          }
        );

        if (!createRes.ok) {
          const errorText = await createRes.text();
          errors.push(`新增 ${key} 失敗: ${createRes.status} - ${errorText}`);
        } else {
          created++;
        }
      }
    } catch (err: any) {
      errors.push(`處理 ${key} 時發生錯誤: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`同步環境變數時發生錯誤:\n${errors.join('\n')}`);
  }

  return { created, updated, errors };
}

/**
 * 取得專案域名
 */
export async function getVercelDomains(): Promise<string[]> {
  const { token, projectId } = getVercelConfig();

  const response = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`無法取得專案資訊: ${response.status}`);
  }

  const data = await response.json();
  const domains: string[] = [];

  // Production 域名
  if (data.targets?.production?.url) {
    domains.push(data.targets.production.url);
  }

  // 自訂域名
  if (data.alias && Array.isArray(data.alias)) {
    domains.push(...data.alias);
  }

  return domains;
}

/**
 * 取得最新部署狀態
 */
export async function getLatestDeployment(): Promise<any> {
  const { token, projectId } = getVercelConfig();

  const response = await fetch(
    `${VERCEL_API_BASE}/v6/deployments?projectId=${projectId}&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`無法取得部署狀態: ${response.status}`);
  }

  const data = await response.json();
  return data.deployments?.[0] || null;
}

import { adminAuth, adminDb } from "@/lib/admin";

export async function GET() {
  try {
    // 從環境變數解析實際的 project_id
    let projectId = "unknown";
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        projectId = serviceAccount.project_id || "unknown";
      } catch {
        projectId = "parse-error";
      }
    }
    
    return Response.json({
      ok: true,
      project: projectId,
      endpoint: "ping-admin",
      hasAdminAuth: !!adminAuth,
      hasAdminDb: !!adminDb,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "ping-admin",
    }, { status: 500 });
  }
}

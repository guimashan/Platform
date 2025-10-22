import { adminDb } from "../lib/firebase-admin";

/**
 * 專案內統一的角色欄位格式：
 * users/{uidByLine}/
 * {
 *   lineUserId: string,
 *   displayName?: string,
 *   pictureUrl?: string,
 *   roles: {
 *     checkin?: "user" | "poweruser" | "admin",
 *     schedule?: "user" | "poweruser" | "admin",
 *     service?: "user" | "poweruser" | "admin"
 *   },
 *   status?: "active" | "resigned",
 *   updatedAt: Firebase Timestamp,
 *   createdAt: Firebase Timestamp
 * }
 */

// 以 LINE userId (mid) 當作 Firestore user 文件的 id（簡化對照；之後可再對接 Firebase Auth）
export async function upsertRoleByKeyword(opts: {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  keyword: string;
}) {
  const { lineUserId, displayName, pictureUrl, keyword } = opts;
  if (!lineUserId) throw new Error("missing lineUserId");

  // 關鍵字 → 角色對照（可持續擴充）
  const map: Record<string, { path: keyof Roles; level: RoleLevel | "resigned" }> = {
    // 奉香
    "奉香註冊":        { path: "checkin", level: "user" },
    "奉香管理註冊":    { path: "checkin", level: "poweruser" },
    "奉香系統註冊":    { path: "checkin", level: "admin" },
    "奉香退場":        { path: "checkin", level: "resigned" },

    // 排班
    "志工註冊":        { path: "schedule", level: "user" },
    "工作註冊":        { path: "schedule", level: "user" },
    "排班管理註冊":    { path: "schedule", level: "poweruser" },
    "排班系統註冊":    { path: "schedule", level: "admin" },
    "排班退場":        { path: "schedule", level: "resigned" },

    // 神服
    "神服服務":        { path: "service", level: "user" },
    "神服管理註冊":    { path: "service", level: "poweruser" },
    "神服系統註冊":    { path: "service", level: "admin" },
    "神服退場":        { path: "service", level: "resigned" },
  };

  type RoleLevel = "user" | "poweruser" | "admin";
  type Roles = { checkin?: RoleLevel; schedule?: RoleLevel; service?: RoleLevel };

  const rule = map[keyword];
  if (!rule) return { updated: false, reason: "keyword_not_mapped" };

  const ref = adminDb.collection("users").doc(lineUserId);
  const snap = await ref.get();
  const now = (await import("firebase-admin")).firestore.FieldValue.serverTimestamp();

  if (!snap.exists) {
    const payload: any = {
      lineUserId,
      displayName: displayName || null,
      pictureUrl: pictureUrl || null,
      roles: {},
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    if (rule.level === "resigned") {
      payload.status = "resigned";
    } else {
      payload.roles[rule.path] = rule.level;
    }
    await ref.set(payload, { merge: true });
    return { updated: true, created: true, keyword, roles: payload.roles, status: payload.status };
  } else {
    const data = snap.data() || {};
    const roles: Roles = { ...(data.roles || {}) };
    let status = data.status || "active";

    if (rule.level === "resigned") {
      // 退場：標記系統離場，但保留其他系統角色
      status = "resigned";
    } else {
      roles[rule.path] = rule.level;
      status = "active";
    }

    await ref.set(
      {
        displayName: displayName || data.displayName || null,
        pictureUrl: pictureUrl || data.pictureUrl || null,
        roles,
        status,
        updatedAt: now,
      },
      { merge: true }
    );
    return { updated: true, created: false, keyword, roles, status };
  }
}

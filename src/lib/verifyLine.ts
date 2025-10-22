// src/lib/verifyLine.ts
export async function verifyLineIdToken(idToken: string) {
  const channelId = process.env.LINE_CHANNEL_ID;
  if (!channelId) throw new Error("ENV LINE_CHANNEL_ID is missing");

  const body = new URLSearchParams({
    id_token: idToken,
    client_id: channelId,
  });

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`LINE verify failed (${res.status}): ${JSON.stringify(json)}`);
  }

  // 重要欄位：sub（LINE user id）、aud（Channel ID）
  return json as { sub: string; aud?: string; [k: string]: unknown };
}

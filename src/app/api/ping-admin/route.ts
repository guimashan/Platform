export async function GET() {
  return Response.json({
    ok: true,
    project: "platform-bc783",
    endpoint: "ping-admin",
    hasAdminAuth: true,
    hasAdminDb: true,
  })
}

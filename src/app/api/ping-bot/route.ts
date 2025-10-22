export async function GET() {
  return Response.json({
    ok: true,
    service: "龜馬山 goLine 平台",
    endpoint: "ping-bot",
    status: "active",
  })
}

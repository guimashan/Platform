import { NextRequest } from "next/server"
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const redirect = url.searchParams.get("redirect") || "/checkin"
  const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${process.env.LINE_CHANNEL_ID}&redirect_uri=${process.env.NEXT_PUBLIC_LINE_CALLBACK_URL}&state=login&scope=profile%20openid%20email`
  return Response.redirect(loginUrl)
}

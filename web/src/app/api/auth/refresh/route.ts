import { NextRequest, NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "@/config/auth";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";
import { refreshTokens } from "@/lib/auth/refresh";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const tokens = await refreshTokens(refreshToken);

  if (!tokens) {
    const response = NextResponse.json(
      { error: { code: "AUTHENTICATION_ERROR", message: "Session expired." } },
      { status: 401 }
    );
    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.json({ success: true });
  setAuthCookies(response, tokens);
  return response;
}

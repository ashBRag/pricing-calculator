import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  apiUrl,
} from "@/config/auth";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";
import { refreshTokens } from "@/lib/auth/refresh";

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "cookie",
]);

async function forward(
  request: NextRequest,
  path: string[],
  accessToken: string | undefined
): Promise<Response> {
  const targetUrl = apiUrl(`/${path.join("/")}${request.nextUrl.search}`);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const canHaveBody = !["GET", "HEAD"].includes(request.method);
  const rawBody = canHaveBody ? await request.text() : "";

  if (!rawBody) {
    headers.delete("content-type");
  }

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body: rawBody || undefined,
  });
}

async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  let backendResponse = await forward(request, path, accessToken);

  if (backendResponse.status === 401) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const tokens = await refreshTokens(refreshToken);

    if (!tokens) {
      const response = NextResponse.json(
        {
          error: {
            code: "AUTHENTICATION_ERROR",
            message: "Session expired. Please log in again.",
          },
        },
        { status: 401 }
      );
      clearAuthCookies(response);
      return response;
    }

    backendResponse = await forward(request, path, tokens.accessToken);

    const body = await backendResponse.text();
    const response = new NextResponse(body, {
      status: backendResponse.status,
      headers: {
        "Content-Type":
          backendResponse.headers.get("Content-Type") ?? "application/json",
      },
    });
    setAuthCookies(response, tokens);
    return response;
  }

  const body = await backendResponse.text();
  return new NextResponse(body, {
    status: backendResponse.status,
    headers: {
      "Content-Type":
        backendResponse.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export {
  handle as GET,
  handle as POST,
  handle as PATCH,
  handle as DELETE,
  handle as PUT,
};

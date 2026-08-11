import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/config/auth";

const PROTECTED_PREFIXES = ["/documents", "/reports"];
const AUTH_PREFIXES = ["/login", "/signup"];

/**
 * Route guard evaluated on every matched request (see `config.matcher`).
 *
 * Auth state is inferred from which cookies are present (cookies expire at
 * their token's own maxAge, see `setAuthCookies`), not from decoding the
 * JWT, so this is a routing-level guard, not the source of truth for API
 * authorization:
 * - No refresh token at all -> never logged in / fully expired -> `/signup`.
 * - Refresh token present but access token missing -> had a session that
 *   lapsed -> `/login`, so the user re-authenticates instead of signing up
 *   again.
 * - Access token present -> `/documents`.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessToken = Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  );
  const hasRefreshToken = Boolean(
    request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  );
  const isAuthenticated = hasAccessToken || hasRefreshToken;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthPage = AUTH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (pathname === "/") {
    const destination = hasAccessToken
      ? "/documents"
      : hasRefreshToken
        ? "/login"
        : "/signup";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isProtected && !isAuthenticated) {
    const signupUrl = new URL("/signup", request.url);
    signupUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signupUrl);
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/documents", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/documents/:path*", "/reports/:path*", "/login", "/signup"],
};

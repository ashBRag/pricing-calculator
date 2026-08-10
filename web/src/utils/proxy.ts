import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/config/auth";

const PROTECTED_PREFIXES = ["/documents", "/reports"];
const AUTH_PREFIXES = ["/login", "/signup"];

/**
 * Route guard evaluated on every matched request (see `config.matcher`).
 *
 * - Unauthenticated requests to a protected route are redirected to
 *   `/signup`.
 * - Authenticated requests to an auth page (`/login`, `/signup`) are
 *   redirected to `/documents`, since there's nothing to sign in/up for.
 * - Everything else passes through unchanged.
 *
 * Authentication is inferred from the presence of either the access or
 * refresh token cookie; it does not verify the token itself, so this is a
 * routing-level guard, not the source of truth for API authorization.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ||
      request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  );

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthPage = AUTH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

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
  matcher: ["/documents/:path*", "/reports/:path*", "/login", "/signup"],
};

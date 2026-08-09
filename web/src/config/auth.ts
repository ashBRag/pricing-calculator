export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60; // matches JWT_ACCESS_EXPIRES_IN
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // matches JWT_REFRESH_EXPIRES_IN

export function apiUrl(path: string): string {
  const base = process.env.API_URL || "http://localhost:3001";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

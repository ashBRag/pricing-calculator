import { apiUrl } from "@/config/auth";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Calls the backend's rotating refresh endpoint. Returns null if the
 * refresh token is missing, expired, or already rotated (reused), so
 * callers can fall back to forcing a re-login instead of throwing.
 */
export async function refreshTokens(
  refreshToken: string | undefined
): Promise<TokenPair | null> {
  if (!refreshToken) return null;

  const response = await fetch(apiUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data?.accessToken || !data?.refreshToken) return null;

  return data as TokenPair;
}

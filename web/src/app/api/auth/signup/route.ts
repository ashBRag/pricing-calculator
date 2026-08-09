import { NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/config/auth";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await fetch(apiUrl("/auth/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendResponse.json().catch(() => ({}));

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const response = NextResponse.json({ success: true });
  setAuthCookies(response, data);
  return response;
}

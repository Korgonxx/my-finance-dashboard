import { NextRequest, NextResponse } from "next/server";

export function checkAuth(req: NextRequest): NextResponse | null {
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    console.error("[checkAuth] API_KEY environment variable is not set.");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const key = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("key");
  if (key !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
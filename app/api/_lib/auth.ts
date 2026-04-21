import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_KEY || "korgon-finance-2026";

export function checkAuth(req: NextRequest): NextResponse | null {
  const key = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("key");
  if (key !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

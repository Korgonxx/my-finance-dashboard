import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_KEY || "korgon-finance-2026";

export function middleware(req: NextRequest) {
  // Only protect API routes
  if (!req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Allow all GET requests (data is loaded before passcode screen)
  if (req.method === "GET") {
    return NextResponse.next();
  }

  // Allow settings POST for passcode verification (no auth yet)
  if (req.nextUrl.pathname === "/api/settings" && req.method === "POST") {
    return NextResponse.next();
  }

  // Check API key for all mutating requests (POST/PUT/DELETE)
  const key = req.headers.get("x-api-key");
  if (key !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};

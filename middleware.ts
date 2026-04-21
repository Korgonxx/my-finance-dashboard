import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_KEY || "korgon-finance-2026";

// Routes that don't need auth (passcode verification)
const PUBLIC_ROUTES = ["/api/settings"];

export function middleware(req: NextRequest) {
  // Only protect API routes
  if (!req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(r => req.nextUrl.pathname.startsWith(r)) && req.method === "GET") {
    return NextResponse.next();
  }

  // Check API key
  const key = req.headers.get("x-api-key");
  if (key !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};

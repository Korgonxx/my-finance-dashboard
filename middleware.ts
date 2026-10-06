import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
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

  // FIX: Removed hardcoded fallback "korgon-finance-2026".
  // If API_KEY env var is not set, all mutating requests are blocked.
  const API_KEY = process.env.API_KEY;

  const key = req.headers.get("x-api-key");
  const session = req.cookies.get("ledger_session")?.value;
  const sessionValid = await verifySessionToken(session);
  if (key === API_KEY || sessionValid) {
    return NextResponse.next();
  }

  if (!API_KEY) {
    console.error("[middleware] API_KEY environment variable is not set and no signed session was provided.");
    return NextResponse.json(
      { error: "Server misconfiguration: API_KEY not set" },
      { status: 500 }
    );
  }

  if (key !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function GET(request: NextRequest) {
  const authenticated = await verifySessionToken(request.cookies.get("ledger_session")?.value);
  return NextResponse.json({ authenticated }, { status: authenticated ? 200 : 401 });
}

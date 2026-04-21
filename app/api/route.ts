import { NextResponse } from "next/server";

// GET /api - Health check
export async function GET() {
  return NextResponse.json({ status: "ok", version: "1.0" });
}

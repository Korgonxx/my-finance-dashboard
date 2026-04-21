import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

function toDbMode(mode: string): string {
  if (mode === "banks") return "web2";
  if (mode === "crypto") return "web3";
  return mode;
}

export async function GET(req: NextRequest) {
  const mode = toDbMode(req.nextUrl.searchParams.get("mode") ?? "banks");
  
  try {
    if (mode === "web3") {
      const row = await db.web3DashboardGoal.findFirst();
      if (!row) return NextResponse.json({ amount: 100000, currency: "USD" });
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    } else {
      const row = await db.web2DashboardGoal.findFirst();
      if (!row) return NextResponse.json({ amount: 5000, currency: "USD" });
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    }
  } catch (err) {
    console.error("[GET /api/goal]", err);
    return NextResponse.json({ amount: 5000, currency: "USD" });
  }
}

export async function POST(req: NextRequest) {
  const { mode: rawMode, amount, currency } = await req.json();
  const mode = toDbMode(rawMode ?? "banks");
  
  try {
    if (mode === "web3") {
      const existing = await db.web3DashboardGoal.findFirst();
      let row;
      if (existing) {
        row = await db.web3DashboardGoal.update({
          where: { id: existing.id },
          data: { amount, currency },
        });
      } else {
        row = await db.web3DashboardGoal.create({
          data: { amount, currency },
        });
      }
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    } else {
      const existing = await db.web2DashboardGoal.findFirst();
      let row;
      if (existing) {
        row = await db.web2DashboardGoal.update({
          where: { id: existing.id },
          data: { amount, currency },
        });
      } else {
        row = await db.web2DashboardGoal.create({
          data: { amount, currency },
        });
      }
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    }
  } catch (err) {
    console.error("[POST /api/goal]", err);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

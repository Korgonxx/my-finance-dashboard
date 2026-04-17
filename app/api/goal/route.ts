import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") ?? "web2";
  
  try {
    if (mode === "web3") {
      const row = await db.web3DashboardGoal.findFirst();
      if (!row) return NextResponse.json({ amount: 60000, currency: "USD" });
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    } else {
      const row = await db.web2DashboardGoal.findFirst();
      if (!row) return NextResponse.json({ amount: 60000, currency: "USD" });
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    }
  } catch (err) {
    console.error("[GET /api/goal]", err);
    // Fallback to legacy table
    try {
      const row = await db.dashboardGoal.findUnique({ where: { mode } });
      if (!row) return NextResponse.json({ amount: 60000, currency: "USD" });
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    } catch (fallbackErr) {
      console.error("[GET /api/goal] Fallback failed", fallbackErr);
      return NextResponse.json({ amount: 60000, currency: "USD" });
    }
  }
}

export async function POST(req: NextRequest) {
  const { mode, amount, currency } = await req.json();
  
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
    // Fallback to legacy table
    try {
      const row = await db.dashboardGoal.upsert({
        where: { mode },
        update: { amount, currency },
        create: { mode, amount, currency },
      });
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    } catch (fallbackErr) {
      console.error("[POST /api/goal] Fallback failed", fallbackErr);
      return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
    }
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { goalSchema } from "../../_lib/validation";

function toDbMode(mode: string): string {
  if (mode === "banks") return "web2";
  if (mode === "crypto") return "web3";
  return mode;
}

export async function GET(req: NextRequest) {
  const rawMode = req.nextUrl.searchParams.get("mode") ?? "banks";
  const mode = toDbMode(rawMode);

  try {
    if (mode === "web3") {
      const row = await db.cryptoDashboardGoal.findFirst();
      if (!row) return NextResponse.json({ amount: 100000, currency: "USD" });
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    } else {
      const row = await db.banksDashboardGoal.findFirst();
      if (!row) return NextResponse.json({ amount: 5000, currency: "USD" });
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    }
  } catch (err) {
    console.error("[GET /api/goal]", err);
    return NextResponse.json({ error: "Failed to load goal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = goalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { mode: rawMode, amount, currency } = parsed.data;
    const mode = toDbMode(rawMode ?? "banks");

    if (mode === "web3") {
      const existing = await db.cryptoDashboardGoal.findFirst();
      let row;
      if (existing) {
        row = await db.cryptoDashboardGoal.update({
          where: { id: existing.id },
          data: { amount, currency: currency ?? "USD" },
        });
      } else {
        row = await db.cryptoDashboardGoal.create({
          data: { amount, currency: currency ?? "USD" },
        });
      }
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    } else {
      const existing = await db.banksDashboardGoal.findFirst();
      let row;
      if (existing) {
        row = await db.banksDashboardGoal.update({
          where: { id: existing.id },
          data: { amount, currency: currency ?? "USD" },
        });
      } else {
        row = await db.banksDashboardGoal.create({
          data: { amount, currency: currency ?? "USD" },
        });
      }
      return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
    }
  } catch (err) {
    console.error("[POST /api/goal]", err);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}
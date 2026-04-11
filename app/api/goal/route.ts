import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") ?? "web2";
  const row = await db.dashboardGoal.findUnique({ where: { mode } });
  if (!row) return NextResponse.json({ amount: 60000, currency: "USD" });
  return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
}

export async function POST(req: NextRequest) {
  const { mode, amount, currency } = await req.json();
  const row = await db.dashboardGoal.upsert({
    where:  { mode },
    update: { amount, currency },
    create: { mode, amount, currency },
  });
  return NextResponse.json({ amount: Number(row.amount), currency: row.currency });
}

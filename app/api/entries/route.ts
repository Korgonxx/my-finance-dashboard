import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

function toEntry(row: any) {
  return {
    id:               row.id,
    mode:             row.mode,
    date:             row.date,
    project:          row.project,
    earned:           Number(row.earned),
    saved:            Number(row.saved),
    given:            Number(row.given),
    givenTo:          row.givenTo,
    walletAddress:    row.walletAddress ?? "",
    walletName:       row.walletName    ?? "",
    investmentAmount: row.investmentAmount ? Number(row.investmentAmount) : undefined,
    currentValue:     row.currentValue     ? Number(row.currentValue)     : undefined,
  };
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") ?? "web2";
  const rows = await db.dashboardEntry.findMany({ where: { mode }, orderBy: { date: "desc" } });
  return NextResponse.json(rows.map(toEntry));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const row = await db.dashboardEntry.create({
    data: {
      id:               body.id,
      mode:             body.mode      ?? "web2",
      date:             body.date,
      project:          body.project,
      earned:           body.earned    ?? 0,
      saved:            body.saved     ?? 0,
      given:            body.given     ?? 0,
      givenTo:          body.givenTo   ?? "",
      walletAddress:    body.walletAddress  ?? null,
      walletName:       body.walletName     ?? null,
      investmentAmount: body.investmentAmount ?? null,
      currentValue:     body.currentValue    ?? null,
    },
  });
  return NextResponse.json(toEntry(row), { status: 201 });
}

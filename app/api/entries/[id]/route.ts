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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const row = await db.dashboardEntry.update({
    where: { id: params.id },
    data: {
      mode:             body.mode,
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
  return NextResponse.json(toEntry(row));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.dashboardEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

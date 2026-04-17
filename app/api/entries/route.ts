import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

function toWeb2Entry(row: any) {
  return {
    id:      row.id,
    mode:    "web2",
    date:    row.date,
    project: row.project,
    earned:  Number(row.earned),
    saved:   Number(row.saved),
    given:   Number(row.given),
    givenTo: row.givenTo,
  };
}

function toWeb3Entry(row: any) {
  return {
    id:               row.id,
    mode:             "web3",
    date:             row.date,
    project:          row.project,
    walletAddress:    row.walletAddress,
    walletName:       row.walletName,
    network:          row.network,
    investmentAmount: Number(row.investmentAmount),
    currentValue:     Number(row.currentValue),
    roi:              Number(row.roi),
  };
}

function toLegacyEntry(row: any) {
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
  
  try {
    if (mode === "web3") {
      const rows = await db.web3DashboardEntry.findMany({ orderBy: { date: "desc" } });
      return NextResponse.json(rows.map(toWeb3Entry));
    } else {
      const rows = await db.web2DashboardEntry.findMany({ orderBy: { date: "desc" } });
      return NextResponse.json(rows.map(toWeb2Entry));
    }
  } catch (err) {
    console.error("[GET /api/entries]", err);
    // Fallback to legacy table if new tables don't exist yet
    try {
      const rows = await db.dashboardEntry.findMany({ where: { mode }, orderBy: { date: "desc" } });
      return NextResponse.json(rows.map(toLegacyEntry));
    } catch (fallbackErr) {
      console.error("[GET /api/entries] Fallback failed", fallbackErr);
      return NextResponse.json({ error: "Failed to load entries" }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode ?? "web2";

    if (mode === "web3") {
      const data = {
        date:             body.date,
        project:          body.project,
        walletAddress:    body.walletAddress ?? "",
        walletName:       body.walletName    ?? "",
        network:          body.network       ?? "Ethereum",
        investmentAmount: body.investmentAmount ?? 0,
        currentValue:     body.currentValue    ?? 0,
        roi:              body.roi             ?? 0,
      };
      const row = await db.web3DashboardEntry.upsert({
        where: { id: body.id },
        update: data,
        create: { ...data, id: body.id },
      });
      return NextResponse.json(toWeb3Entry(row), { status: 201 });
    } else {
      const data = {
        date:    body.date,
        project: body.project,
        earned:  body.earned ?? 0,
        saved:   body.saved  ?? 0,
        given:   body.given  ?? 0,
        givenTo: body.givenTo ?? "",
      };
      const row = await db.web2DashboardEntry.upsert({
        where: { id: body.id },
        update: data,
        create: { ...data, id: body.id },
      });
      return NextResponse.json(toWeb2Entry(row), { status: 201 });
    }
  } catch (err) {
    console.error("[POST /api/entries]", err);
    // Fallback to legacy table
    try {
      const body = await req.json();
      const data = {
        mode:             body.mode ?? "web2",
        date:             body.date,
        project:          body.project,
        earned:           body.earned ?? 0,
        saved:            body.saved ?? 0,
        given:            body.given ?? 0,
        givenTo:          body.givenTo ?? "",
        walletAddress:    body.walletAddress ?? null,
        walletName:       body.walletName ?? null,
        investmentAmount: body.investmentAmount ?? null,
        currentValue:     body.currentValue ?? null,
      };
      const row = await db.dashboardEntry.upsert({
        where: { id: body.id },
        update: data,
        create: { ...data, id: body.id },
      });
      return NextResponse.json(toLegacyEntry(row), { status: 201 });
    } catch (fallbackErr) {
      console.error("[POST /api/entries] Fallback failed", fallbackErr);
      return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
    }
  }
}

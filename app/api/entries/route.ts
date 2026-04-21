import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Map frontend modes to DB table modes
function toDbMode(mode: string): string {
  if (mode === "banks") return "web2";
  if (mode === "crypto") return "web3";
  return mode; // fallback for legacy
}

function toFrontendMode(dbMode: string): string {
  if (dbMode === "web2") return "banks";
  if (dbMode === "web3") return "crypto";
  return dbMode;
}

function toBanksEntry(row: any) {
  return {
    id:      row.id,
    mode:    "banks",
    date:    row.date,
    project: row.project,
    earned:  Number(row.earned),
    saved:   Number(row.saved),
    given:   Number(row.given),
    givenTo: row.givenTo,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt ?? null,
  };
}

function toCryptoEntry(row: any) {
  return {
    id:               row.id,
    mode:             "crypto",
    date:             row.date,
    project:          row.project,
    walletAddress:    row.walletAddress,
    walletName:       row.walletName,
    network:          row.network,
    investmentAmount: Number(row.investmentAmount),
    currentValue:     Number(row.currentValue),
    roi:              Number(row.roi),
    earned:           Number(row.currentValue),
    saved:            Number(row.investmentAmount),
    given:            0,
    givenTo:          row.network,
    createdAt:        row.createdAt?.toISOString?.() ?? row.createdAt ?? null,
  };
}

export async function GET(req: NextRequest) {
  const mode = toDbMode(req.nextUrl.searchParams.get("mode") ?? "banks");
  
  try {
    if (mode === "web3") {
      const rows = await db.cryptoDashboardEntry.findMany({ orderBy: { date: "desc" } });
      return NextResponse.json(rows.map(toCryptoEntry));
    } else {
      const rows = await db.banksDashboardEntry.findMany({ orderBy: { date: "desc" } });
      return NextResponse.json(rows.map(toBanksEntry));
    }
  } catch (err) {
    console.error("[GET /api/entries]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dbMode = toDbMode(body.mode ?? "banks");

    if (dbMode === "web3") {
      const data = {
        date:             body.date,
        project:          body.project,
        walletAddress:    body.walletAddress ?? "",
        walletName:       body.walletName    ?? "",
        network:          body.network       ?? "Ethereum",
        investmentAmount: body.investmentAmount ?? body.saved ?? body.given ?? 0,
        currentValue:     body.currentValue    ?? body.earned ?? body.given ?? 0,
        roi:              body.roi             ?? 0,
      };
      const row = await db.cryptoDashboardEntry.upsert({
        where: { id: body.id },
        update: data,
        create: { ...data, id: body.id },
      });
      return NextResponse.json(toCryptoEntry(row), { status: 201 });
    } else {
      const data = {
        date:    body.date,
        project: body.project,
        earned:  body.earned ?? 0,
        saved:   body.saved  ?? 0,
        given:   body.given  ?? 0,
        givenTo: body.givenTo ?? "",
      };
      const row = await db.banksDashboardEntry.upsert({
        where: { id: body.id },
        update: data,
        create: { ...data, id: body.id },
      });
      return NextResponse.json(toBanksEntry(row), { status: 201 });
    }
  } catch (err) {
    console.error("[POST /api/entries]", err);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}

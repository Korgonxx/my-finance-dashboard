import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { entrySchema } from "../../_lib/validation";

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
    return NextResponse.json({ error: "Failed to load entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = entrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const dbMode = toDbMode(data.mode ?? "banks");

    if (dbMode === "web3") {
      const row = await db.cryptoDashboardEntry.upsert({
        where: { id: data.id ?? "" },
        update: {
          date:             data.date,
          project:          data.project,
          walletAddress:    data.walletAddress ?? "",
          walletName:       data.walletName    ?? "",
          network:          data.network       ?? "Ethereum",
          investmentAmount: data.investmentAmount || data.saved || data.given || 0,
          currentValue:     data.currentValue    || data.earned || data.given || 0,
          roi:              data.roi             ?? 0,
        },
        create: {
          id: data.id ?? undefined,
          date:             data.date,
          project:          data.project,
          walletAddress:    data.walletAddress ?? "",
          walletName:       data.walletName    ?? "",
          network:          data.network       ?? "Ethereum",
          investmentAmount: data.investmentAmount || data.saved || data.given || 0,
          currentValue:     data.currentValue    || data.earned || data.given || 0,
          roi:              data.roi             ?? 0,
        },
      });
      return NextResponse.json(toCryptoEntry(row), { status: 201 });
    } else {
      const row = await db.banksDashboardEntry.upsert({
        where: { id: data.id ?? "" },
        update: {
          date:    data.date,
          project: data.project,
          earned:  data.earned ?? 0,
          saved:   data.saved  ?? 0,
          given:   data.given  ?? 0,
          givenTo: (data.givenTo ?? "").toLowerCase(),
        },
        create: {
          id: data.id ?? undefined,
          date:    data.date,
          project: data.project,
          earned:  data.earned ?? 0,
          saved:   data.saved  ?? 0,
          given:   data.given  ?? 0,
          givenTo: (data.givenTo ?? "").toLowerCase(),
        },
      });
      return NextResponse.json(toBanksEntry(row), { status: 201 });
    }
  } catch (err) {
    console.error("[POST /api/entries]", err);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}

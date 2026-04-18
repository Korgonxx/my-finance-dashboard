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
      return NextResponse.json(rows.map((r: any) => ({
        id: r.id,
        mode: r.mode,
        date: r.date,
        project: r.project,
        earned: Number(r.earned),
        saved: Number(r.saved),
        given: Number(r.given),
        givenTo: r.givenTo,
        walletAddress: r.walletAddress ?? "",
        walletName: r.walletName ?? "",
        investmentAmount: r.investmentAmount ? Number(r.investmentAmount) : undefined,
        currentValue: r.currentValue ? Number(r.currentValue) : undefined,
      })));
    } catch (fallbackErr) {
      console.error("[GET /api/entries] Fallback failed", fallbackErr);
      return NextResponse.json({ error: "Failed to load entries" }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[POST /api/entries] Received:", { mode: body.mode, id: body.id, project: body.project });
    
    const mode = body.mode ?? "web2";

    if (mode === "web3") {
      console.log("[POST /api/entries] Creating web3 entry:", body);
      const row = await db.web3DashboardEntry.create({
        data: {
          id:               body.id,
          date:             body.date,
          project:          body.project,
          walletAddress:    body.walletAddress || "Unknown",
          walletName:       body.walletName || "Unknown",
          network:          body.network ?? "Ethereum",
          investmentAmount: Number(body.investmentAmount) || 0,
          currentValue:     Number(body.currentValue) || 0,
          roi:              Number(body.roi) || 0,
        },
      });
      console.log("[POST /api/entries] Created web3 entry:", row);
      return NextResponse.json(toWeb3Entry(row), { status: 201 });
    } else {
      console.log("[POST /api/entries] Creating web2 entry:", body);
      const row = await db.web2DashboardEntry.create({
        data: {
          id:      body.id,
          date:    body.date,
          project: body.project,
          earned:  Number(body.earned) || 0,
          saved:   Number(body.saved) || 0,
          given:   Number(body.given) || 0,
          givenTo: body.givenTo ?? "",
        },
      });
      console.log("[POST /api/entries] Created web2 entry:", row);
      return NextResponse.json(toWeb2Entry(row), { status: 201 });
    }
  } catch (err) {
    console.error("[POST /api/entries] Error:", err);
    return NextResponse.json({ error: String(err), type: typeof err }, { status: 500 });
  }
}

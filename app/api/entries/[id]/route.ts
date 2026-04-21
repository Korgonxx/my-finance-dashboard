import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { entryUpdateSchema } from "../../../_lib/validation";

function toDbMode(mode: string): string {
  if (mode === "banks") return "web2";
  if (mode === "crypto") return "web3";
  return mode;
}

function toEntry(row: any, dbMode: string) {
  if (dbMode === "web3") {
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
    };
  }
  return {
    id:      row.id,
    mode:    "banks",
    date:    row.date,
    project: row.project,
    earned:  Number(row.earned),
    saved:   Number(row.saved),
    given:   Number(row.given),
    givenTo: row.givenTo,
  };
}

async function findEntry(id: string) {
  const web2 = await db.banksDashboardEntry.findUnique({ where: { id } });
  if (web2) return { row: web2, mode: "web2" };
  const web3 = await db.cryptoDashboardEntry.findUnique({ where: { id } });
  if (web3) return { row: web3, mode: "web3" };
  return null;
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = entryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const dbMode = toDbMode(data.mode ?? "banks");

    let row;
    if (dbMode === "web3") {
      row = await db.cryptoDashboardEntry.update({
        where: { id },
        data: {
          date:             data.date,
          project:          data.project,
          walletAddress:    data.walletAddress  ?? "",
          walletName:       data.walletName     ?? "",
          network:          data.network        ?? "Ethereum",
          investmentAmount: data.investmentAmount || data.saved || data.given || 0,
          currentValue:     data.currentValue    || data.earned || data.given || 0,
          roi:              data.roi             ?? 0,
        },
      });
    } else {
      row = await db.banksDashboardEntry.update({
        where: { id },
        data: {
          date:    data.date,
          project: data.project,
          earned:  data.earned  ?? 0,
          saved:   data.saved   ?? 0,
          given:   data.given   ?? 0,
          givenTo: (data.givenTo ?? "").toLowerCase(),
        },
      });
    }
    return NextResponse.json(toEntry(row, dbMode));
  } catch (err) {
    console.error("[PUT /api/entries/[id]]", err);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const found = await findEntry(id);
    if (!found) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    if (found.mode === "web3") {
      await db.cryptoDashboardEntry.delete({ where: { id } });
    } else {
      await db.banksDashboardEntry.delete({ where: { id } });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/entries/[id]]", err);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}

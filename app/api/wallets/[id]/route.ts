import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.account.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const row = await db.account.update({
    where: { id: params.id },
    data: {
      name: body.name,
      network: body.network,
      walletAddress: body.address,
      currentBalance: body.balance ?? 0,
    },
  });
  return NextResponse.json({ id: row.id, name: row.name, address: row.walletAddress ?? "", network: row.network ?? "Ethereum", balance: Number(row.currentBalance), createdAt: row.createdAt.toISOString().slice(0,10) });
}

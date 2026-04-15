import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const rows = await db.account.findMany({
      where: { type: "CRYPTO_WALLET", deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows.map(r => ({
      id:            r.id,
      name:          r.name,
      address:       r.walletAddress ?? "",
      network:       r.network       ?? "Ethereum",
      balance:       Number(r.currentBalance),
      createdAt:     r.createdAt.toISOString().slice(0,10),
      isEncrypted:   (r.walletMeta as any)?.isEncrypted   ?? false,
      encryptedData: (r.walletMeta as any)?.encryptedData ?? null,
      passcode:      (r.walletMeta as any)?.passcode       ?? null,
    })));
  } catch (err) {
    console.error("[GET /api/wallets]", err);
    return NextResponse.json({ error: "Failed to load wallets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const row = await db.account.create({
      data: {
        userId:           "default",
        name:             body.name,
        type:             "CRYPTO_WALLET",
        network:          body.network  ?? "Ethereum",
        walletAddress:    body.address  ?? null,
        currentBalance:   body.balance  ?? 0,
        availableBalance: body.balance  ?? 0,
        color:            "#8b5cf6",
        walletMeta: body.isEncrypted ? {
          isEncrypted:   true,
          encryptedData: body.encryptedData ?? null,
          passcode:      body.passcode      ?? null,
        } : undefined,
      },
    });
    return NextResponse.json({
      id:            row.id,
      name:          row.name,
      address:       row.walletAddress ?? "",
      network:       row.network       ?? "Ethereum",
      balance:       Number(row.currentBalance),
      createdAt:     row.createdAt.toISOString().slice(0,10),
      isEncrypted:   (row.walletMeta as any)?.isEncrypted   ?? false,
      encryptedData: (row.walletMeta as any)?.encryptedData ?? null,
      passcode:      (row.walletMeta as any)?.passcode       ?? null,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/wallets]", err);
    return NextResponse.json({ error: "Failed to create wallet" }, { status: 500 });
  }
}
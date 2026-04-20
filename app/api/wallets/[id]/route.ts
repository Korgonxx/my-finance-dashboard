import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await db.account.findUnique({ where: { id } });
    if (!row || row.type !== "CRYPTO_WALLET") {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }
    return NextResponse.json({
      id:            row.id,
      name:          row.name,
      address:       row.walletAddress ?? "",
      network:       row.network       ?? "Ethereum",
      balance:       Number(row.currentBalance),
      createdAt:     row.createdAt.toISOString().slice(0,10),
      isEncrypted:   (row.walletMeta as any)?.isEncrypted   ?? false,
      encryptedData: (row.walletMeta as any)?.encryptedData ?? null,
    });
  } catch (err) {
    console.error("[GET /api/wallets/[id]]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.account.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/wallets/[id]]", err);
    return NextResponse.json({ error: "Failed to delete wallet" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Handle decrypt action - just return encrypted data
    if (body.action === "decrypt") {
      const row = await db.account.findUnique({ where: { id } });
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({
        encryptedData: (row.walletMeta as any)?.encryptedData ?? null,
      });
    }

    // Handle update
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.walletAddress = body.address;
    if (body.network !== undefined) updateData.network = body.network;
    if (body.balance !== undefined) {
      updateData.currentBalance = body.balance;
      updateData.availableBalance = body.balance;
    }
    if (body.isEncrypted !== undefined) {
      updateData.walletMeta = body.isEncrypted ? {
        isEncrypted: true,
        encryptedData: body.encryptedData ?? null,
      } : undefined;
    }

    const row = await db.account.update({
      where: { id },
      data: updateData,
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
    });
  } catch (err) {
    console.error("[PUT /api/wallets/[id]]", err);
    return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 });
  }
}

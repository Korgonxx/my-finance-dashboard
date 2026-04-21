import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { walletUpdateSchema } from "../../../_lib/validation";

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
    const parsed = walletUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    // Handle decrypt action - just return encrypted data
    if (data.action === "decrypt") {
      const row = await db.account.findUnique({ where: { id } });
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({
        encryptedData: (row.walletMeta as any)?.encryptedData ?? null,
      });
    }

    // Handle update
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.walletAddress = data.address;
    if (data.network !== undefined) updateData.network = data.network;
    if (data.balance !== undefined) {
      updateData.currentBalance = data.balance;
      updateData.availableBalance = data.balance;
    }
    if (data.isEncrypted !== undefined) {
      updateData.walletMeta = data.isEncrypted ? {
        isEncrypted: true,
        encryptedData: data.encryptedData ?? null,
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
    });
  } catch (err) {
    console.error("[PUT /api/wallets/[id]]", err);
    return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 });
  }
}

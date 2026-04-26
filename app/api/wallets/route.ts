import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { walletSchema } from "../../_lib/validation";

// Get or create a default user ID for wallets
async function getDefaultUserId(): Promise<string> {
  const user = await db.user.findFirst();
  if (user) return user.id;
  const created = await db.user.create({
    data: {
      email: "korgon@local",
      name: "Korgon",
      firstName: "Korgon",
      lastName: "",
      theme: "dark",
      banksGoal: 0,
      cryptoGoal: 0,
    },
  });
  return created.id;
}

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
    })));
  } catch (err) {
    console.error("[GET /api/wallets]", err);
    return NextResponse.json({ error: "Failed to load wallets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = walletSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const userId = await getDefaultUserId();
    const row = await db.account.create({
      data: {
        userId,
        name: data.name.toLowerCase().trim(),
        type:             "CRYPTO_WALLET",
        network: (data.network ?? "ethereum").toLowerCase(),
        walletAddress:    data.address       ?? null,
        currentBalance:   data.balance       ?? 0,
        availableBalance: data.balance       ?? 0,
        color:            "#8b5cf6",
        walletMeta: data.isEncrypted ? {
          isEncrypted:   true,
          encryptedData: data.encryptedData ?? null,
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
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/wallets]", err);
    return NextResponse.json({ error: "Failed to create wallet" }, { status: 500 });
  }
}

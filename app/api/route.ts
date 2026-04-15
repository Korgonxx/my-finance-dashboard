import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Optional: define a type for safer access
type WalletMeta = {
  isEncrypted?: boolean;
  encryptedData?: string | null;
  passcode?: string | null;
};

// Get or create a default user ID for wallets
async function getDefaultUserId(): Promise<string> {
  const user = await db.user.findFirst();
  if (user) return user.id;

  const created = await db.user.create({
    data: {
      email: "default@korgon.finance",
      name: "Default User",
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

    return NextResponse.json(
      rows.map((r) => {
        const meta = r.walletMeta as WalletMeta;

        return {
          id:        r.id,
          name:      r.name,
          address:   r.walletAddress ?? "",
          network:   r.network ?? "Ethereum",
          balance:   Number(r.currentBalance),
          createdAt: r.createdAt.toISOString().slice(0, 10),

          // ✅ Safe fields only
          isEncrypted:   meta?.isEncrypted ?? false,
          encryptedData: meta?.encryptedData ?? null,

          // ❌ passcode removed (security)
        };
      })
    );
  } catch (err) {
    console.error("[GET /api/wallets]", err);
    return NextResponse.json(
      { error: "Failed to load wallets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = await getDefaultUserId();

    const row = await db.account.create({
      data: {
        userId,
        name:             body.name,
        type:             "CRYPTO_WALLET",
        network:          body.network ?? "Ethereum",
        walletAddress:    body.address ?? null,
        currentBalance:   body.balance ?? 0,
        availableBalance: body.balance ?? 0,
        color:            "#8b5cf6",

        walletMeta: body.isEncrypted
          ? {
              isEncrypted:   true,
              encryptedData: body.encryptedData ?? null,

              // ❌ Do NOT store raw passcode
              // If needed, hash it (see below)
            }
          : undefined,
      },
    });

    const meta = row.walletMeta as WalletMeta;

    return NextResponse.json(
      {
        id:        row.id,
        name:      row.name,
        address:   row.walletAddress ?? "",
        network:   row.network ?? "Ethereum",
        balance:   Number(row.currentBalance),
        createdAt: row.createdAt.toISOString().slice(0, 10),

        // ✅ Safe fields only
        isEncrypted:   meta?.isEncrypted ?? false,
        encryptedData: meta?.encryptedData ?? null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/wallets]", err);
    return NextResponse.json(
      { error: "Failed to create wallet" },
      { status: 500 }
    );
  }
}
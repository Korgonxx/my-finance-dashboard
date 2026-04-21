import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Get or create a default user ID
async function getDefaultUserId(): Promise<string> {
  const user = await db.user.findFirst();
  if (user) return user.id;
  const created = await db.user.create({
    data: { email: "default@korgon.finance", name: "Default User" },
  });
  return created.id;
}

export async function GET() {
  try {
    const rows = await db.account.findMany({
      where: { type: { in: ["CHECKING", "SAVINGS", "CREDIT_CARD"] }, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    // Seed defaults if no cards exist
    if (rows.length === 0) {
      const userId = await getDefaultUserId();
      const defaults = [
        { name: "korgon Premium", last4: "4209", type: "CREDIT_CARD" as const, expiry: "12/28" },
        { name: "Virtual Card", last4: "8831", type: "CHECKING" as const, expiry: "05/25" },
      ];
      const created = await Promise.all(defaults.map(d =>
        db.account.create({
          data: {
            userId,
            name: d.name,
            type: d.type,
            accountNumber: d.last4,
            institutionName: "Default User",
            color: d.expiry,
            currentBalance: 0,
            availableBalance: 0,
            currency: "USD",
          },
        })
      ));
      return NextResponse.json(created.map(r => ({
        id:       r.id,
        name:     r.name,
        last4:    r.accountNumber ?? "0000",
        holder:   r.institutionName ?? "",
        expiry:   r.color ?? "",
        type:     r.type === "CREDIT_CARD" ? "physical" : "virtual",
        balance:  Number(r.currentBalance),
        cardType: r.type,
      })));
    }
    return NextResponse.json(rows.map(r => ({
      id:       r.id,
      name:     r.name,
      last4:    r.accountNumber ?? "0000",
      holder:   r.institutionName ?? "",
      expiry:   r.color ?? "12/28",
      type:     r.type === "CREDIT_CARD" ? "physical" : "virtual",
      balance:  Number(r.currentBalance),
      cardType: r.type,
    })));
  } catch (err) {
    console.error("[GET /api/cards]", err);
    return NextResponse.json([]);
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
        type:             body.type === "physical" ? "CREDIT_CARD" : "CHECKING",
        accountNumber:    body.last4 ?? null,
        institutionName:  body.holder ?? null,
        color:            body.expiry ?? null,
        currentBalance:   body.balance ?? 0,
        availableBalance: body.balance ?? 0,
        currency:         "USD",
      },
    });
    return NextResponse.json({
      id:       row.id,
      name:     row.name,
      last4:    row.accountNumber ?? "0000",
      holder:   row.institutionName ?? "",
      expiry:   row.color ?? "",
      type:     row.type === "CREDIT_CARD" ? "physical" : "virtual",
      balance:  Number(row.currentBalance),
      cardType: row.type,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/cards]", err);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}

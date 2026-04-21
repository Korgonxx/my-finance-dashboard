import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

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
    console.error("[DELETE /api/cards/[id]]", err);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updateData: any = {};
    if (body.balance !== undefined) {
      updateData.currentBalance = body.balance;
      updateData.availableBalance = body.balance;
    }
    if (body.name !== undefined) updateData.name = body.name;
    const row = await db.account.update({
      where: { id },
      data: updateData,
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
    });
  } catch (err) {
    console.error("[PUT /api/cards/[id]]", err);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

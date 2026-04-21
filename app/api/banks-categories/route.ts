import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.banksEntryCategory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error("[GET /api/banks-categories]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const category = await db.banksEntryCategory.create({
      data: {
        name: body.name,
        icon: body.icon || "📁",
        color: body.color || "#22c55e",
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }
    console.error("[POST /api/banks-categories]", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.banksEntryCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/banks-categories]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const category = await db.banksEntryCategory.update({
      where: { id: body.id },
      data: {
        name: body.name,
        icon: body.icon,
        color: body.color,
      },
    });
    return NextResponse.json(category);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }
    console.error("[PUT /api/banks-categories]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

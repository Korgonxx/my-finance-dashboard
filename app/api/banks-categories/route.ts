import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { categorySchema } from "../../_lib/validation";

export async function GET() {
  try {
    const categories = await db.banksEntryCategory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error("[GET /api/banks-categories]", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const category = await db.banksEntryCategory.create({
      data: {
        name: data.name.toLowerCase().trim(),
        icon: data.icon ?? "📁",
        color: data.color ?? "#22c55e",
        imageUrl: data.imageUrl ?? null,
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
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    if (!data.id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }
    const category = await db.banksEntryCategory.update({
      where: { id: data.id },
      data: {
        name: data.name,
        icon: data.icon,
        color: data.color,
        imageUrl: data.imageUrl,
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

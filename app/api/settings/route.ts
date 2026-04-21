import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

async function getDefaultUserId(): Promise<string> {
  const user = await db.user.findFirst();
  if (user) return user.id;
  const created = await db.user.create({
    data: { email: "default@korgon.finance", name: "Default User", passcode: "123456" },
  });
  return created.id;
}

export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) return NextResponse.json({ passcode: "123456" });
    return NextResponse.json({ passcode: user.passcode ?? "123456" });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ passcode: "123456" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = await getDefaultUserId();
    
    const updateData: any = {};
    if (body.passcode !== undefined) updateData.passcode = body.passcode;
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No data to update" }, { status: 400 });
    }
    
    await db.user.update({
      where: { id: userId },
      data: updateData,
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/settings]", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

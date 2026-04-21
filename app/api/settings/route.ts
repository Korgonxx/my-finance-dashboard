import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import crypto from "crypto";

function hashPasscode(passcode: string): string {
  return crypto.createHash("sha256").update(passcode).digest("hex");
}

export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) return NextResponse.json({ passcodeHash: hashPasscode("123456") });
    return NextResponse.json({ passcodeHash: user.passcode ?? hashPasscode("123456") });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ passcodeHash: hashPasscode("123456") });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.currentPasscode || !body.newPasscode) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    
    const user = await db.user.findFirst();
    if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });
    
    // Verify current passcode against stored hash
    const currentHash = hashPasscode(body.currentPasscode);
    const storedHash = user.passcode ?? hashPasscode("123456");
    
    if (currentHash !== storedHash) {
      return NextResponse.json({ error: "Current passcode is incorrect" }, { status: 403 });
    }
    
    // Store hash of new passcode
    const newHash = hashPasscode(body.newPasscode);
    await db.user.update({
      where: { id: user.id },
      data: { passcode: newHash },
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/settings]", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

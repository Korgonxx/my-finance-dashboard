import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import crypto from "crypto";

function hashPasscode(passcode: string): string {
  return crypto.createHash("sha256").update(passcode).digest("hex");
}

// GET /api/settings - Return all user settings
export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      // Auto-create user if none exists
      const created = await db.user.create({
        data: {
          email: "korgon@local",
          firstName: "Korgon",
          lastName: "",
          theme: "dark",
          banksGoal: 0,
          cryptoGoal: 0,
          passcode: hashPasscode("123456"),
        },
      });
      return NextResponse.json({
        firstName: created.firstName ?? "Korgon",
        lastName: created.lastName ?? "",
        email: created.email,
        avatarUrl: created.avatarUrl ?? "",
        theme: created.theme ?? "dark",
        banksGoal: Number(created.banksGoal ?? 0),
        cryptoGoal: Number(created.cryptoGoal ?? 0),
        passcodeHash: created.passcode ?? hashPasscode("123456"),
      });
    }
    return NextResponse.json({
      firstName: user.firstName ?? user.name?.split(" ")[0] ?? "Korgon",
      lastName: user.lastName ?? user.name?.split(" ").slice(1).join(" ") ?? "",
      email: user.email,
      avatarUrl: user.avatarUrl ?? "",
      theme: user.theme ?? "dark",
      banksGoal: Number(user.banksGoal ?? 0),
      cryptoGoal: Number(user.cryptoGoal ?? 0),
      passcodeHash: user.passcode ?? hashPasscode("123456"),
    });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({
      firstName: "Korgon",
      lastName: "",
      email: "",
      avatarUrl: "",
      theme: "dark",
      banksGoal: 0,
      cryptoGoal: 0,
      passcodeHash: hashPasscode("123456"),
    });
  }
}

// PUT /api/settings - Update profile fields (name, email, theme, goals, avatar)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await db.user.findFirst();
    if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.theme !== undefined) updateData.theme = body.theme;
    if (body.banksGoal !== undefined) updateData.banksGoal = Number(body.banksGoal);
    if (body.cryptoGoal !== undefined) updateData.cryptoGoal = Number(body.cryptoGoal);

    await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PUT /api/settings]", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

// POST /api/settings - Change passcode (requires current passcode verification)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.currentPasscode || !body.newPasscode) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await db.user.findFirst();
    if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });

    const currentHash = hashPasscode(body.currentPasscode);
    const storedHash = user.passcode ?? hashPasscode("123456");

    if (currentHash !== storedHash) {
      return NextResponse.json({ error: "Current passcode is incorrect" }, { status: 403 });
    }

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

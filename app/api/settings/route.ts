import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { settingsSchema } from "../../_lib/validation";

// Rate limiting: track failed passcode attempts per IP
const failedAttempts = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(key: string): { blocked: boolean; remaining: number } {
  const now = Date.now();
  const entry = failedAttempts.get(key);

  if (!entry || now > entry.resetTime) {
    return { blocked: false, remaining: 5 };
  }

  if (entry.count >= 5) {
    return { blocked: true, remaining: 0 };
  }

  return { blocked: false, remaining: 5 - entry.count };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const entry = failedAttempts.get(key);

  if (!entry || now > entry.resetTime) {
    failedAttempts.set(key, { count: 1, resetTime: now + 60_000 });
  } else {
    entry.count++;
  }
}

function clearFailedAttempts(key: string) {
  failedAttempts.delete(key);
}

// GET /api/settings - Return all user settings (excluding passcodeHash)
export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      // Auto-create user if none exists (no passcode set)
      const created = await db.user.create({
        data: {
          email: "korgon@local",
          firstName: "Korgon",
          lastName: "",
          theme: "dark",
          banksGoal: 0,
          cryptoGoal: 0,
          passcode: null,
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
        hasPasscode: false,
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
      hasPasscode: !!user.passcode,
    });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

// PUT /api/settings - Update profile fields (name, email, theme, goals, avatar)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const user = await db.user.findFirst();
    if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.banksGoal !== undefined) updateData.banksGoal = Number(data.banksGoal);
    if (data.cryptoGoal !== undefined) updateData.cryptoGoal = Number(data.cryptoGoal);

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

// POST /api/settings - Change passcode or verify passcode
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Action: verify passcode (for login)
    if (body.action === "verify-passcode") {
      const ipKey = getRateLimitKey(req);
      const rateCheck = checkRateLimit(ipKey);

      if (rateCheck.blocked) {
        return NextResponse.json(
          { error: "Too many failed attempts. Please wait 1 minute before trying again." },
          { status: 429 }
        );
      }

      if (!body.passcode) {
        return NextResponse.json({ error: "Missing passcode" }, { status: 400 });
      }

      const user = await db.user.findFirst();
      if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });
      if (!user.passcode) {
        return NextResponse.json({ error: "No passcode set" }, { status: 400 });
      }

      const isValid = await bcrypt.compare(body.passcode, user.passcode);
      if (!isValid) {
        recordFailedAttempt(ipKey);
        const remaining = 5 - (failedAttempts.get(ipKey)?.count || 0);
        return NextResponse.json(
          { error: "Incorrect passcode", attemptsRemaining: Math.max(0, remaining) },
          { status: 401 }
        );
      }

      clearFailedAttempts(ipKey);
      return NextResponse.json({ success: true, authenticated: true });
    }

    // Action: set initial passcode (when none exists)
    if (body.action === "set-passcode") {
      if (!body.newPasscode) {
        return NextResponse.json({ error: "Missing newPasscode" }, { status: 400 });
      }

      if (body.newPasscode.length < 6) {
        return NextResponse.json({ error: "Passcode must be at least 6 characters" }, { status: 400 });
      }

      const user = await db.user.findFirst();
      if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });
      if (user.passcode) {
        return NextResponse.json({ error: "Passcode already set. Use change-passcode instead." }, { status: 400 });
      }

      const newHash = await bcrypt.hash(body.newPasscode, 10);
      await db.user.update({
        where: { id: user.id },
        data: { passcode: newHash },
      });

      return NextResponse.json({ success: true });
    }

    // Action: change passcode (requires current passcode verification)
    if (!body.currentPasscode || !body.newPasscode) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await db.user.findFirst();
    if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });
    if (!user.passcode) {
      return NextResponse.json({ error: "No passcode set. Use set-passcode first." }, { status: 400 });
    }

    const isCurrentValid = await bcrypt.compare(body.currentPasscode, user.passcode);
    if (!isCurrentValid) {
      return NextResponse.json({ error: "Current passcode is incorrect" }, { status: 403 });
    }

    const newHash = await bcrypt.hash(body.newPasscode, 10);
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

import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/activity - Fetch recent activity across all types
export async function GET() {
  try {
    const [entries, cards, wallets] = await Promise.all([
      db.banksDashboardEntry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      db.banksCard.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.cryptoWalletLegacy.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const cryptoEntries = await db.cryptoDashboardEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    // Map to unified activity format
    const activities = [
      ...entries.map(e => ({
        id: e.id,
        type: 'bank_entry' as const,
        action: `Added bank entry: ${e.project}`,
        amount: Number(e.earned),
        date: e.createdAt.toISOString(),
        mode: 'banks' as const,
      })),
      ...cryptoEntries.map(e => ({
        id: e.id,
        type: 'crypto_entry' as const,
        action: `Added crypto entry: ${e.project}`,
        amount: Number(e.investmentAmount),
        date: e.createdAt.toISOString(),
        mode: 'crypto' as const,
      })),
      ...cards.map(c => ({
        id: c.id,
        type: 'card' as const,
        action: `Added card: ${c.name}`,
        amount: Number(c.balance),
        date: c.createdAt.toISOString(),
        mode: 'banks' as const,
      })),
      ...wallets.map(w => ({
        id: w.id,
        type: 'wallet' as const,
        action: `Added wallet: ${w.name}`,
        amount: Number(w.balance),
        date: w.createdAt.toISOString(),
        mode: 'crypto' as const,
      })),
    ];

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(activities.slice(0, 30));
  } catch (error) {
    console.error('[activity] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

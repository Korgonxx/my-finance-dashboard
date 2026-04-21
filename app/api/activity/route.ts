import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/activity - Fetch recent activity across all types
export async function GET() {
  try {
    // Get entries from their own tables
    const [bankEntries, cryptoEntries] = await Promise.all([
      db.banksDashboardEntry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      db.cryptoDashboardEntry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    // Get cards and wallets from Account table
    const [cards, wallets] = await Promise.all([
      db.account.findMany({
        where: { type: { in: ['CHECKING', 'SAVINGS', 'CREDIT_CARD'] }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.account.findMany({
        where: { type: 'CRYPTO_WALLET', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Map to unified activity format
    const activities = [
      ...bankEntries.map(e => ({
        id: e.id,
        type: 'bank_entry' as const,
        action: `Bank entry: ${e.project}`,
        amount: Number(e.earned),
        date: e.createdAt.toISOString(),
        mode: 'banks' as const,
      })),
      ...cryptoEntries.map(e => ({
        id: e.id,
        type: 'crypto_entry' as const,
        action: `Crypto entry: ${e.project}`,
        amount: Number(e.investmentAmount),
        date: e.createdAt.toISOString(),
        mode: 'crypto' as const,
      })),
      ...cards.map(c => ({
        id: c.id,
        type: 'card' as const,
        action: `Card: ${c.name}`,
        amount: Number(c.currentBalance),
        date: c.createdAt.toISOString(),
        mode: 'banks' as const,
      })),
      ...wallets.map(w => ({
        id: w.id,
        type: 'wallet' as const,
        action: `Wallet: ${w.name}`,
        amount: Number(w.currentBalance),
        date: w.createdAt.toISOString(),
        mode: 'crypto' as const,
      })),
    ];

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(activities.slice(0, 30));
  } catch (error) {
    console.error('[activity] GET error:', error);
    return NextResponse.json([]);
  }
}

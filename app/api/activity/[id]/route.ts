import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// DELETE /api/activity?id=xxx&type=bank_entry|crypto_entry|card|wallet
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ error: 'Missing id or type' }, { status: 400 });
    }

    switch (type) {
      case 'bank_entry':
        await db.banksDashboardEntry.delete({ where: { id } });
        break;
      case 'crypto_entry':
        await db.cryptoDashboardEntry.delete({ where: { id } });
        break;
      case 'card':
        // Cards are stored in Account table
        await db.account.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        break;
      case 'wallet':
        // Wallets are stored in Account table
        await db.account.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[activity] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

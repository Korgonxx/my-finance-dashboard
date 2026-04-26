import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// FIX: Use dynamic route param `id` from the URL segment, not searchParams
// File lives at: app/api/activity/[id]/route.ts
// Called as: DELETE /api/activity/{id}?type=bank_entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
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
        await db.account.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        break;
      case 'wallet':
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
    console.error('[activity/[id]] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
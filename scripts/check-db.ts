import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  console.error("❌  POSTGRES_PRISMA_URL is not set. Run: vercel env pull .env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('=== USERS ===');
  const users = await prisma.user.findMany();
  users.forEach(u =>
    console.log('  ID:', u.id, '| Email:', u.email, '| Has passcode:', !!u.passcode)
  );

  console.log('\n=== ACCOUNTS (Cards & Wallets) ===');

  // FIX: Use Account model (not separate card/wallet models) for cards
  const cards = await prisma.account.findMany({
    where: { type: { in: ['CHECKING', 'SAVINGS', 'CREDIT_CARD'] }, deletedAt: null },
  });
  console.log('  Cards count:', cards.length);
  cards.forEach(c =>
    console.log('  ', c.id, '|', c.name, '| Type:', c.type, '| Balance:', Number(c.currentBalance))
  );

  // FIX: Use Account model for crypto wallets
  const wallets = await prisma.account.findMany({
    where: { type: 'CRYPTO_WALLET', deletedAt: null },
  });
  console.log('\n  Wallets count:', wallets.length);
  wallets.forEach(w =>
    console.log('  ', w.id, '|', w.name, '|', w.walletAddress?.substring(0, 20) + '... | Bal:', Number(w.currentBalance), '| Net:', w.network)
  );

  console.log('\n=== BANKS ENTRIES (count) ===');
  console.log('  ', await prisma.banksDashboardEntry.count());

  console.log('\n=== CRYPTO ENTRIES (latest 3) ===');
  const cryptoEntries = await prisma.cryptoDashboardEntry.findMany({
    orderBy: { date: 'desc' },
    take: 3,
  });
  console.log('  Total count:', await prisma.cryptoDashboardEntry.count());
  cryptoEntries.forEach(e =>
    console.log('  ', e.date, '|', e.project, '| Invested:', Number(e.investmentAmount), '| Current:', Number(e.currentValue))
  );

  console.log('\n=== BANKS GOAL ===');
  const banksGoal = await prisma.banksDashboardGoal.findFirst();
  console.log('  ', banksGoal ? `Amount: ${Number(banksGoal.amount)} ${banksGoal.currency}` : 'Not set');

  console.log('\n=== CRYPTO GOAL ===');
  const cryptoGoal = await prisma.cryptoDashboardGoal.findFirst();
  console.log('  ', cryptoGoal ? `Amount: ${Number(cryptoGoal.amount)} ${cryptoGoal.currency}` : 'Not set');

  console.log('\n=== CATEGORIES ===');
  const cats = await prisma.banksEntryCategory.findMany();
  console.log('  Count:', cats.length);
  cats.forEach(c => console.log('  ', c.icon, c.name));
}

main()
  .catch(e => { console.error('ERROR:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
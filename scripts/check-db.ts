import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.POSTGRES_PRISMA_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== USERS ===');
  const users = await prisma.user.findMany();
  users.forEach(u => console.log('  ID:', u.id, '| Email:', u.email, '| Passcode hash:', u.passcode?.substring(0, 20) + '...'));

  console.log('\n=== BANK CARDS ===');
  const cards = await prisma.banksCard.findMany();
  console.log('  Count:', cards.length);
  cards.forEach(c => console.log('  ', c.id, '|', c.name, '| Balance:', c.balance));

  console.log('\n=== CRYPTO WALLETS ===');
  const wallets = await prisma.cryptoWallet.findMany();
  console.log('  Count:', wallets.length);
  wallets.forEach(w => console.log('  ', w.id, '|', w.name, '|', w.address?.substring(0, 20) + '... | Bal:', w.balance, '| Net:', w.network));

  console.log('\n=== BANK ENTRIES (count) ===');
  console.log('  ', await prisma.banksDashboardEntry.count());

  console.log('\n=== CRYPTO ENTRIES ===');
  const cryptoEntries = await prisma.cryptoDashboardEntry.findMany({ orderBy: { date: 'desc' }, take: 3 });
  console.log('  Count:', await prisma.cryptoDashboardEntry.count());
  cryptoEntries.forEach(e => console.log('  ', e.date, '|', e.project, '| Invested:', e.investmentAmount, '| Current:', e.currentValue));

  console.log('\n=== TRANSFERS ===');
  console.log('  ', await prisma.transfer.count());
}

main().catch(e => console.error('ERROR:', e)).finally(() => prisma.$disconnect());

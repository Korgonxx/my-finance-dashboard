#!/usr/bin/env tsx
/**
 * Deduplication tool — safe by default
 * 
 * Modes:
 *   npx tsx scripts/deduplicate.ts            → dry-run (shows plan only)
 *   npx tsx scripts/deduplicate.ts --execute  → applies changes
 *   npx tsx scripts/deduplicate.ts --sql      → prints SQL only
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--execute') ? false : true;
const SQL_ONLY = process.argv.includes('--sql');

async function query<T>(sql: TemplateStringsArray, params: any[]): Promise<T[]> {
  return prisma.$queryRaw<T>(sql, ...params);
}

async function main() {
  console.log(`🔍 Deduplication scan ${DRY_RUN ? '(DRY RUN — no changes)' : '(EXECUTE mode)'}
`);

  // ── 1. banksEntryCategory duplicates (by LOWER(name)) ───────────────────────
  const catDupes: any[] = await query`
    SELECT LOWER(name) AS norm, COUNT(*) as cnt, 
           array_agg(id ORDER BY createdAt) as ids, 
           array_agg(name) as names
    FROM "banksEntryCategory"
    GROUP BY LOWER(name)
    HAVING COUNT(*) > 1
  `;

  if (catDupes.length > 0) {
    console.log('📁 Duplicate Categories:');
    for (const d of catDupes) {
      console.log(`  • "${d.norm}" → ${d.cnt} records`);
      console.log(`    IDs: ${d.ids.join(', ')} | Names: [${d.names.join(', ')}]`);
      const [keepId, ...deleteIds] = d.ids;
      if (DRY_RUN || SQL_ONLY) {
        console.log(`    [DRY] Keep ${keepId}, delete ${deleteIds.length} duplicates`);
        for (const delId of deleteIds) {
          const updateSql = `UPDATE "banksDashboardEntry" SET "categoryId" = '${keepId}' WHERE "categoryId" = '${delId}';`;
          console.log(`    SQL> ${updateSql}`);
        }
        const deleteSql = `DELETE FROM "banksEntryCategory" WHERE id IN (${deleteIds.map((id: string)=>`'${id}'`).join(',')});`;
        console.log(`    SQL> ${deleteSql}`);
      } else {
        await prisma.banksDashboardEntry.updateMany({
          where: { categoryId: { in: deleteIds } },
          data: { categoryId: keepId },
        });
        await prisma.banksEntryCategory.deleteMany({
          where: { id: { in: deleteIds } },
        });
        console.log(`    ✅ Merged → kept ${keepId}, deleted ${deleteIds.length}`);
      }
    }
    console.log('');
  } else {
    console.log('✅ No duplicate categories
');
  }

  // ── 2. Wallet networks ───────────────────────────────────────────────────────
  const walletDupes: any[] = await query`
    SELECT LOWER(network) AS norm, COUNT(*) as cnt, 
           array_agg(id ORDER BY createdAt) as ids, 
           array_agg(network) as names
    FROM "wallet"
    GROUP BY LOWER(network)
    HAVING COUNT(*) > 1
  `;

  if (walletDupes.length > 0) {
    console.log('💰 Duplicate Wallet Networks:');
    for (const d of walletDupes) {
      console.log(`  • "${d.norm}" → ${d.cnt} records`);
      console.log(`    IDs: ${d.ids.join(', ')} | Networks: [${d.names.join(', ')}]`);
      const [keepId, ...deleteIds] = d.ids;
      if (DRY_RUN || SQL_ONLY) {
        console.log(`    [DRY] Keep ${keepId}, delete ${deleteIds.length} duplicates`);
        for (const delId of deleteIds) {
          const updateSql = `UPDATE "cryptoDashboardEntry" SET "walletId" = '${keepId}' WHERE "walletId" = '${delId}';`;
          console.log(`    SQL> ${updateSql}`);
        }
        const deleteSql = `DELETE FROM "wallet" WHERE id IN (${deleteIds.map((id: string)=>`'${id}'`).join(',')});`;
        console.log(`    SQL> ${deleteSql}`);
      } else {
        await prisma.cryptoDashboardEntry.updateMany({
          where: { walletId: { in: deleteIds } },
          data: { walletId: keepId },
        });
        await prisma.wallet.deleteMany({
          where: { id: { in: deleteIds } },
        });
        console.log(`    ✅ Merged → kept ${keepId}, deleted ${deleteIds.length}`);
      }
    }
    console.log('');
  } else {
    console.log('✅ No duplicate wallet networks
');
  }

  // ── 3. Card names ────────────────────────────────────────────────────────────
  const cardDupes: any[] = await query`
    SELECT LOWER(name) AS norm, COUNT(*) as cnt, 
           array_agg(id ORDER BY createdAt) as ids, 
           array_agg(name) as names
    FROM "account"
    WHERE type IN ('CREDIT_CARD', 'CHECKING')
    GROUP BY LOWER(name)
    HAVING COUNT(*) > 1
  `;

  if (cardDupes.length > 0) {
    console.log('💳 Duplicate Card Names:');
    for (const d of cardDupes) {
      console.log(`  • "${d.norm}" → ${d.cnt} records`);
      console.log(`    IDs: ${d.ids.join(', ')} | Names: [${d.names.join(', ')}]`);
      const [keepId, ...deleteIds] = d.ids;
      if (DRY_RUN || SQL_ONLY) {
        console.log(`    [DRY] Keep ${keepId}, delete ${deleteIds.length} duplicates`);
        const deleteSql = `DELETE FROM "account" WHERE id IN (${deleteIds.map((id: string)=>`'${id}'`).join(',')});`;
        console.log(`    SQL> ${deleteSql}`);
      } else {
        await prisma.account.deleteMany({
          where: { id: { in: deleteIds } },
        });
        console.log(`    ✅ Deleted ${deleteIds.length} duplicates`);
      }
    }
    console.log('');
  } else {
    console.log('✅ No duplicate card names
');
  }

  if (DRY_RUN && !SQL_ONLY) {
    console.log('ℹ️  Run with --execute to apply changes');
    console.log('ℹ️  Or run with --sql to print SQL only
');
  }

  if (SQL_ONLY) {
    console.log('--- End of SQL ---');
    console.log('Copy & run these statements in your DB console (pgAdmin, psql, etc.)');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

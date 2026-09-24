#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const checks = [
  ['auth current user helper', 'src/lib/auth.ts', 'getCurrentUser'],
  ['active store context', 'src/lib/store-context.ts', 'status: "ACTIVE"'],
  ['theme helper uses active owner', 'src/app/api/theme/route.ts', 'ownerId: userId'],
  ['domain POST resolves active store', 'src/app/api/domains/route.ts', 'const activeStoreId = await getActiveStoreId(userId);'],
  ['payment methods PUT resolves active store', 'src/app/api/payment-methods/route.ts', 'const activeStoreId = await getActiveStoreId(userId);'],
  ['subscription change resolves active store', 'src/app/api/subscription/route.ts', 'const activeStoreId = await getActiveStoreId(user.id);'],
  ['analytics uses OrderItem.unitPrice', 'src/app/api/analytics/route.ts', 'i.unitPrice'],
  ['public storefront uses published theme', 'src/app/tienda/[slug]/page.tsx', 'publishedTheme'],
  ['public storefront blocks suspended stores', 'src/app/tienda/[slug]/page.tsx', 'status: "ACTIVE"'],
  ['checkout validates payment configuration', 'src/app/api/store/[slug]/orders/route.ts', 'paymentConfig'],
  ['checkout uses atomic product stock decrement', 'src/app/api/store/[slug]/orders/route.ts', 'updateMany'],
  ['order item preserves variant', 'src/app/api/store/[slug]/orders/route.ts', 'variantId: i.variantId'],
  ['schema preserves variant on order item', 'prisma/schema.prisma', 'variant   ProductVariant?'],
];

let failures = 0;
for (const [name, file, needle] of checks) {
  const p = path.resolve(file);
  const ok = fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes(needle);
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`);
  if (!ok) failures++;
}

const apiFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/route\.(ts|js)$/.test(entry.name)) apiFiles.push(p);
  }
}
walk(path.resolve('src/app/api'));
console.log(`API route files discovered: ${apiFiles.length}`);
if (apiFiles.length < 50) failures++;

if (failures) {
  console.log(`FINAL STATIC REGRESSION: FAIL (${failures})`);
  process.exit(1);
}
console.log('FINAL STATIC REGRESSION: PASS');

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src/app/api');
const excluded = [
  '/admin/',
  '/webhooks/',
  '/store/context',
  '/store/switch',
  '/store/[slug]/',
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name === 'route.ts') out.push(full);
  }
  return out;
}

const findings = [];
const crossStoreRisks = [];
for (const file of walk(root)) {
  const rel = '/' + path.relative(root, file).replaceAll(path.sep, '/').replace(/\/route\.ts$/, '');
  const text = fs.readFileSync(file, 'utf8');
  const authenticated = text.includes('getSessionUserId') || text.includes('getCurrentUser');
  if (!authenticated) continue;
  if (excluded.some(prefix => rel.startsWith(prefix))) continue;
  if (!text.includes('getActiveStoreId')) {
    findings.push(rel);
  }

  // Product writes that accept categoryId must validate that the category belongs
  // to the active store before persisting the foreign key.
  if (rel === '/products' || rel === '/products/[id]') {
    const writesCategory = text.includes('categoryId:');
    const validatesCategory = text.includes('category.findFirst') && text.includes('storeId: activeStoreId') || text.includes('storeId: store.id');
    if (writesCategory && !validatesCategory) crossStoreRisks.push(`${rel}: categoryId sin validación de tienda`);
  }
}

console.log(`Rutas autenticadas sin getActiveStoreId: ${findings.length}`);
for (const item of findings) console.log(` - ${item}`);
if (crossStoreRisks.length) {
  console.log(`Riesgos de referencias cruzadas: ${crossStoreRisks.length}`);
  for (const item of crossStoreRisks) console.log(` - ${item}`);
}
if (findings.length || crossStoreRisks.length) process.exit(1);

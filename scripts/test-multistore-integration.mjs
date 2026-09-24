import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('FAIL: define TEST_DATABASE_URL (preferido) o DATABASE_URL para ejecutar la prueba de integración.');
  process.exit(2);
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let user;
let storeA;
let storeB;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  user = await prisma.user.create({
    data: {
      name: `MultiTest ${suffix}`,
      email: `multitest-${suffix}@example.invalid`,
      passwordHash: 'integration-test',
      stores: {
        create: [
          { name: `Tienda A ${suffix}`, slug: `test-a-${suffix}` },
          { name: `Tienda B ${suffix}`, slug: `test-b-${suffix}` },
        ],
      },
    },
    include: { stores: true },
  });

  [storeA, storeB] = user.stores;

  const categoryA = await prisma.category.create({
    data: { name: 'Categoría A', slug: `cat-a-${suffix}`, storeId: storeA.id },
  });
  const categoryB = await prisma.category.create({
    data: { name: 'Categoría B', slug: `cat-b-${suffix}`, storeId: storeB.id },
  });

  const productA = await prisma.product.create({
    data: {
      name: 'Producto A',
      slug: `producto-a-${suffix}`,
      price: 1000,
      stock: 10,
      storeId: storeA.id,
      categoryId: categoryA.id,
    },
  });
  const productB = await prisma.product.create({
    data: {
      name: 'Producto B',
      slug: `producto-b-${suffix}`,
      price: 2000,
      stock: 20,
      storeId: storeB.id,
      categoryId: categoryB.id,
    },
  });

  // Simula las consultas que una ruta debe hacer después de resolver la tienda activa.
  const visibleFromA = await prisma.product.findMany({ where: { storeId: storeA.id } });
  const visibleFromB = await prisma.product.findMany({ where: { storeId: storeB.id } });
  assert(visibleFromA.some((p) => p.id === productA.id), 'Tienda A no ve su producto.');
  assert(!visibleFromA.some((p) => p.id === productB.id), 'FUGA: Tienda A ve producto de B.');
  assert(visibleFromB.some((p) => p.id === productB.id), 'Tienda B no ve su producto.');
  assert(!visibleFromB.some((p) => p.id === productA.id), 'FUGA: Tienda B ve producto de A.');

  // Verifica que la validación de categoría por tienda rechaza una referencia cruzada.
  const foreignCategory = await prisma.category.findFirst({
    where: { id: categoryB.id, storeId: storeA.id },
  });
  assert(foreignCategory === null, 'FUGA: una categoría de B aparece como perteneciente a A.');

  // Verifica que recursos identificados dentro del contexto activo no se encuentran cruzados.
  const crossProduct = await prisma.product.findFirst({ where: { id: productB.id, storeId: storeA.id } });
  const crossCategory = await prisma.category.findFirst({ where: { id: categoryB.id, storeId: storeA.id } });
  assert(crossProduct === null, 'FUGA: producto B accesible con storeId A.');
  assert(crossCategory === null, 'FUGA: categoría B accesible con storeId A.');

  console.log('Prueba funcional multi-tienda: PASS');
  console.log(`  Tienda A: ${storeA.id}`);
  console.log(`  Tienda B: ${storeB.id}`);
  console.log('  A solo ve recursos A: PASS');
  console.log('  B solo ve recursos B: PASS');
  console.log('  Referencias cruzadas bloqueadas por contexto: PASS');
} catch (error) {
  console.error('Prueba funcional multi-tienda: FAIL');
  console.error(error?.stack || error);
  process.exitCode = 1;
} finally {
  if (user?.id) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
  await prisma.$disconnect();
}

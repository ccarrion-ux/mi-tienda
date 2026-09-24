import fs from "node:fs";
import path from "node:path";

const checks = [
  { file: "src/app/api/products/route.ts", needles: ["getActiveStoreId", "category.findFirst", "storeId: store.id"] },
  { file: "src/app/api/products/[id]/route.ts", needles: ["getActiveStoreId", "category.findFirst", "storeId: activeStoreId"] },
  { file: "src/app/api/orders/[id]/route.ts", needles: ["getActiveStoreId", "storeId: activeStoreId"] },
  { file: "src/app/api/shipping-methods/[id]/route.ts", needles: ["getActiveStoreId", "storeId: activeStoreId"] },
  { file: "src/app/api/categories/route.ts", needles: ["getActiveStoreId", "storeId: activeStoreId"] },
  { file: "src/app/api/ai/action/confirm/route.ts", needles: ["getActiveStoreId", "store.id"] },
];

const failures=[];
for (const check of checks) {
  const text=fs.readFileSync(path.resolve(check.file),"utf8");
  for (const needle of check.needles) if (!text.includes(needle)) failures.push(`${check.file}: falta ${needle}`);
}

console.log(`Prueba estática multi-tienda: ${failures.length ? "FAIL" : "PASS"}`);
if (failures.length) { for (const f of failures) console.log(` - ${f}`); process.exit(1); }
console.log("PASS: selección de tienda activa y referencias críticas están protegidas.");

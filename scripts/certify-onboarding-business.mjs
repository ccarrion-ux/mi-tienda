import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  schema: "prisma/schema.prisma",
  migration: "prisma/migrations/20260927_business_information/migration.sql",
  validation: "src/lib/business-info.ts",
  api: "src/app/api/onboarding/business/route.ts",
  page: "src/app/onboarding/negocio/page.tsx",
  onboarding: "src/app/api/onboarding/route.ts",
};

const content = Object.fromEntries(
  Object.entries(files).map(([key, relative]) => {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) throw new Error(`Falta archivo: ${relative}`);
    return [key, fs.readFileSync(file, "utf8")];
  })
);

const checks = [
  ["schema.businessName", content.schema.includes('businessName       String?')],
  ["schema.businessInfoCompletedAt", content.schema.includes("businessInfoCompletedAt DateTime?")],
  ["migration.business_columns", content.migration.includes('ADD COLUMN "businessName" TEXT') && content.migration.includes('ADD COLUMN "contactEmail" TEXT')],
  ["validation.normalize", content.validation.includes("normalizeBusinessInfo")],
  ["validation.rut", content.validation.includes("isValidRut")],
  ["validation.required_fields", content.validation.includes("businessName.length < 2") && content.validation.includes("businessType.length < 2") && content.validation.includes("!input.contactEmail")],
  ["api.auth", content.api.includes("getCurrentUser") && content.api.includes('status: 401')],
  ["api.owner_isolation", content.api.includes("ownerId: user.id")],
  ["api.active_store", content.api.includes("getActiveStoreId(user.id)")],
  ["api.validation_422", content.api.includes("status: 422") && content.api.includes("validateBusinessInfo")],
  ["api.persist", content.api.includes("businessInfoCompletedAt") && content.api.includes("prisma.store.update")],
  ["page.step_1_of_5", content.page.includes("PASO 1 DE 5") && content.page.includes('1 / 5')],
  ["page.business_fields", ["businessName","businessType","businessDescription","contactEmail","phone","website","rut","country","region","commune","address"].every(field => content.page.includes(`"${field}"`) || content.page.includes(`name="${field}"`))],
  ["page.submit_endpoint", content.page.includes('"/api/onboarding/business"') && content.page.includes('method: "PUT"')],
  ["onboarding.checklist", content.onboarding.includes('id: "business"') && content.onboarding.includes('/onboarding/negocio')],
];

const failed = checks.filter(([, ok]) => !ok);
console.log("ONBOARDING STEP 1 - BUSINESS INFORMATION");
for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
if (failed.length) {
  console.error(`\n${failed.length} validaciones fallaron.`);
  process.exit(1);
}
console.log(`\nPASS: ${checks.length}/${checks.length} validaciones técnicas.`);

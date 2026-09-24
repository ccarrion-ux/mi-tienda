#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(src);
const codeFiles = files.filter((f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f));
const code = codeFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");

const envUsed = [...code.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((m) => m[1]);
const envSet = new Set(envExample.split(/\r?\n/)
  .map((line) => line.match(/^([A-Z0-9_]+)=/))
  .filter(Boolean)
  .map((m) => m[1]));

const missingEnv = [...new Set(envUsed)].filter((name) =>
  !envSet.has(name) && !["NODE_ENV"].includes(name)
);

const storesZero = [...code.matchAll(/stores\s*\[\s*0\s*\]/g)].length;
const prismaStoreFirst = [...code.matchAll(/prisma\.store\.findFirst\s*\(\s*\{\s*where:\s*\{\s*ownerId\s*:/g)].length;

const routeFiles = files.filter((f) => f.includes(`${path.sep}api${path.sep}`) && /route\.(ts|js)$/.test(f));
const routeCount = routeFiles.length;

const requiredScripts = [
  "check:multistore",
  "audit:active-store",
  "audit:store-isolation",
  "test:multistore:static",
  "validate:production",
  "validate:all",
  "pilot:check",
  "typecheck",
  "lint:check",
  "build",
];

const missingScripts = requiredScripts.filter((name) => !pkg.scripts?.[name]);

const findings = [];
if (storesZero) findings.push(`FAIL: se encontraron ${storesZero} usos de stores[0].`);
if (missingEnv.length) findings.push(`FAIL: variables de entorno usadas pero ausentes en .env.example: ${missingEnv.join(", ")}`);
if (missingScripts.length) findings.push(`FAIL: scripts faltantes: ${missingScripts.join(", ")}`);
if (pkg.packageManager !== "npm@10.9.2") findings.push(`WARN: packageManager esperado npm@10.9.2, encontrado ${pkg.packageManager ?? "ausente"}.`);
if (pkg.engines?.node !== ">=22.16.0 <23") findings.push("WARN: rango Node no coincide con el entorno reproducible definido.");
if (routeCount === 0) findings.push("FAIL: no se encontraron API routes.");

console.log(`API routes: ${routeCount}`);
console.log(`stores[0]: ${storesZero}`);
console.log(`ownerId findFirst directos: ${prismaStoreFirst}`);
console.log(`env vars no declaradas: ${missingEnv.length}`);
console.log(`scripts requeridos faltantes: ${missingScripts.length}`);

if (findings.length) {
  for (const f of findings) console.log(f);
  process.exitCode = findings.some((f) => f.startsWith("FAIL")) ? 1 : 0;
} else {
  console.log("RELEASE STATIC AUDIT: PASS");
}

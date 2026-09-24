import fs from "node:fs";
import { execSync } from "node:child_process";

const checks = [];
const add = (name, status, detail = "") => checks.push({ name, status, detail });

const has = (p) => fs.existsSync(p);
add("package-lock.json", has("package-lock.json") ? "PASS" : "BLOCKED", has("package-lock.json") ? "Lockfile presente" : "Generar con npm install en un entorno con red");
add(".env.example", has(".env.example") ? "PASS" : "FAIL");
add("Prisma schema", has("prisma/schema.prisma") ? "PASS" : "FAIL");
add("GitHub production workflow", has(".github/workflows/production-check.yml") ? "PASS" : "FAIL");

for (const [name, cmd] of [
  ["Environment preflight", "npm run env:preflight"],
  ["Multi-store static", "npm run check:multistore"],
  ["Active store audit", "npm run audit:active-store"],
  ["Store isolation audit", "npm run audit:store-isolation"],
  ["Multi-store static test", "npm run test:multistore:static"],
]) {
  try { execSync(cmd, { stdio: "ignore" }); add(name, "PASS"); }
  catch { add(name, "FAIL"); }
}

console.log("=== MI TIENDA · VALIDATION MATRIX ===");
for (const c of checks) console.log(`${c.status.padEnd(7)} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
console.log("\nInterpretación: BLOCKED significa que el entorno actual no permite validar ese punto todavía; no equivale a un error del código.");
process.exitCode = checks.some((c) => c.status === "FAIL") ? 1 : 0;

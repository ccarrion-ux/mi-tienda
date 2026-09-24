#!/usr/bin/env node
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const hasLock = fs.existsSync("package-lock.json");
const hasNodeModules = fs.existsSync("node_modules");

function run(label, command, args) {
  console.log(`\n== ${label} ==`);
  const r = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`${label}: FAIL`);
    process.exitCode = r.status || 1;
    return false;
  }
  console.log(`${label}: PASS`);
  return true;
}

console.log("Mi Tienda — instalación y build reproducible");
console.log(`package-lock.json: ${hasLock ? "FOUND" : "MISSING"}`);
console.log(`node_modules: ${hasNodeModules ? "FOUND" : "MISSING"}`);

if (!hasLock) {
  console.error("BLOCKED: no existe package-lock.json. Generarlo en CI/red antes de ejecutar npm ci.");
  process.exitCode = 2;
} else if (!hasNodeModules) {
  console.log("Dependencias no instaladas. Ejecutar npm ci en un entorno con acceso al registry.");
  process.exitCode = 2;
} else {
  const checks = [
    ["Prisma validate", "npx", ["prisma", "validate"]],
    ["Prisma generate", "npx", ["prisma", "generate"]],
    ["TypeScript", "npm", ["run", "typecheck"]],
    ["ESLint", "npm", ["run", "lint:check"]],
    ["Next build", "npm", ["run", "build"]],
  ];
  for (const [label, cmd, args] of checks) {
    if (!run(label, cmd, args)) break;
  }
}

if (process.exitCode === undefined) console.log("\nCERTIFICATION: PASS");
else console.log(`\nCERTIFICATION: BLOCKED/FAIL (${process.exitCode})`);

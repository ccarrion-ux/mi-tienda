import fs from "node:fs";
import { execFileSync } from "node:child_process";

const requiredFiles = [
  "package.json",
  "package-lock.json",
  "prisma/schema.prisma",
  "next.config.mjs",
  "scripts-smoke-check.mjs"
];

const requiredScripts = ["build", "start", "smoke", "typecheck", "lint:check", "pilot:check"];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
} catch {
  console.error("PILOT CHECK: FAIL — package.json no es válido.");
  process.exit(1);
}

const missingScripts = requiredScripts.filter(name => !pkg.scripts?.[name]);
const lockfileOk = fs.existsSync("package-lock.json");

let buildPresent = false;
try {
  buildPresent = fs.existsSync(".next/BUILD_ID") || fs.existsSync(".next/server");
} catch {}

console.log("=== PILOT READINESS ===");
console.log(`PASS package.json válido`);
console.log(`PASS lockfile presente: ${lockfileOk}`);
console.log(`PASS build de producción presente: ${buildPresent}`);

if (missingFiles.length) {
  console.error(`FAIL archivos requeridos ausentes: ${missingFiles.join(", ")}`);
}
if (missingScripts.length) {
  console.error(`FAIL scripts requeridos ausentes: ${missingScripts.join(", ")}`);
}

if (!lockfileOk || !buildPresent || missingFiles.length || missingScripts.length) {
  console.error("PILOT READINESS: FAIL");
  process.exit(1);
}

console.log("PILOT READINESS: PASS");

#!/usr/bin/env node
import fs from "node:fs";
import { spawnSync } from "node:child_process";

function run(label, command, args) {
  console.log(`\n== ${label} ==`);
  const r = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`${label}: FAIL`);
    process.exit(r.status || 1);
  }
  console.log(`${label}: PASS`);
}

if (!fs.existsSync("package-lock.json")) {
  run("Generate package-lock", "npm", [
    "install", "--package-lock-only", "--ignore-scripts",
    "--no-audit", "--no-fund"
  ]);
}

run("npm ci", "npm", ["ci"]);
run("Prisma validate", "npx", ["prisma", "validate"]);
run("Prisma generate", "npx", ["prisma", "generate"]);
run("Prisma db push", "npx", ["prisma", "db", "push"]);
run("Static release audit", "npm", ["run", "audit:release:static"]);
run("Regression static", "npm", ["run", "regression:static"]);
run("TypeScript", "npm", ["run", "typecheck"]);
run("ESLint", "npm", ["run", "lint:check"]);
run("Next build", "npm", ["run", "build"]);
run("Smoke", "npm", ["run", "smoke"]);
run("Pilot check", "npm", ["run", "pilot:check"]);

console.log("\nCERTIFICATION: PASS");

#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";

const manifest = {
  project: "Mi Tienda",
  phase: 60,
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: `${os.platform()}-${os.arch()}`,
  lockfilePresent: fs.existsSync("package-lock.json"),
  certificationRule: "PASS only when the CI workflow completes all required steps successfully.",
  requiredSteps: [
    "npm ci",
    "prisma validate",
    "prisma generate",
    "prisma db push",
    "static audits",
    "typecheck",
    "eslint",
    "next build",
    "smoke",
    "pilot:check"
  ]
};
fs.writeFileSync("certification-manifest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest, null, 2));

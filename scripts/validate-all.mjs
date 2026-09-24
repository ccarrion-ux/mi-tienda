import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

const results = [];
function run(label, cmd, args, options = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32", ...options });
  const ok = r.status === 0;
  results.push({ label, status: ok ? "PASS" : "FAIL", code: r.status ?? 1 });
  if (!ok && options.stopOnFail !== false) return false;
  return ok;
}

if (!existsSync("package-lock.json")) {
  console.log("No package-lock.json found. It must be generated in a networked environment.");
  results.push({ label: "package-lock", status: "BLOCKED", code: null });
  writeFileSync("validation-result.json", JSON.stringify(results, null, 2));
  process.exit(2);
}

if (!run("npm ci", "npm", ["ci", "--no-audit", "--no-fund"])) process.exit(1);
if (!run("Prisma validate", "npx", ["prisma@6.19.3", "validate"])) process.exit(1);
if (!run("Prisma generate", "npx", ["prisma@6.19.3", "generate"])) process.exit(1);
if (!run("Multi-store static", "npm", ["run", "check:multistore"])) process.exit(1);
if (!run("Active-store audit", "npm", ["run", "audit:active-store"])) process.exit(1);
if (!run("TypeScript", "npm", ["run", "typecheck"])) process.exit(1);
if (!run("ESLint", "npm", ["run", "lint:check"])) process.exit(1);
if (!run("Next build", "npm", ["run", "build"])) process.exit(1);

run("Smoke", "npm", ["run", "smoke"], { stopOnFail: false });
run("Pilot", "npm", ["run", "pilot:check"], { stopOnFail: false });

writeFileSync("validation-result.json", JSON.stringify(results, null, 2));
const failed = results.filter(x => x.status === "FAIL");
process.exit(failed.length ? 1 : 0);

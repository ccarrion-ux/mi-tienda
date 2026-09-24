import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const hasLockfile = existsSync("package-lock.json");
const commands = [
  ["Prisma validate", "npx prisma@6.19.3 validate"],
  ["Prisma generate", "npx prisma@6.19.3 generate"],
  ["Multi-store", "npm run check:multistore"],
  ["Active store audit", "npm run audit:active-store"],
  ["Store isolation audit", "npm run audit:store-isolation"],
  ["Static multi-store test", "npm run test:multistore:static"],
  ["ESLint", "npm run lint"],
  ["TypeScript", "npm run typecheck"],
  ["Next build", "npm run build"],
];

const results = [{
  name: "package-lock.json",
  status: hasLockfile ? "PASS" : "BLOCKED",
  reason: hasLockfile ? "Lockfile disponible." : "Falta package-lock.json; ejecuta npm run lockfile:prepare en un entorno con red y commitea el resultado."
}];

if (!hasLockfile) {
  console.warn("BLOCKED: package-lock.json no existe. Se ejecutarán igualmente las validaciones de código disponibles.");
}

for (const [name, command] of commands) {
  console.log(`\n=== ${name} ===`);
  try {
    execSync(command, { stdio: "inherit", cwd: process.cwd() });
    results.push({ name, status: "PASS" });
  } catch {
    results.push({ name, status: "FAIL", reason: "El comando terminó con código distinto de cero." });
    console.error(`FAILED: ${name}`);
  }
}

console.log("\n=== VALIDATION SUMMARY ===");
for (const result of results) {
  console.log(`${result.status.padEnd(7)} ${result.name}${result.reason ? ` — ${result.reason}` : ""}`);
}

const hardFailures = results.some((r) => r.status === "FAIL");
process.exitCode = hardFailures ? 1 : 0;

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

if (!existsSync("package-lock.json")) {
  console.log("package-lock.json no existe; generándolo en el runner CI...");
  execSync("npm install --package-lock-only --ignore-scripts --no-audit --no-fund", { stdio: "inherit" });
}

if (!existsSync("package-lock.json")) {
  throw new Error("No fue posible generar package-lock.json.");
}

console.log("Lockfile disponible. CI continuará con npm ci.");

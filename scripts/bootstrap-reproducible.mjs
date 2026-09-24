import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const run = (cmd, args) => {
  console.log(`\\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (!existsSync("package-lock.json")) {
  run("npm", ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"]);
}
run("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"]);
run("npx", ["prisma@6.19.3", "validate"]);
run("npx", ["prisma@6.19.3", "generate"]);
run("npm", ["run", "typecheck"]);
run("npm", ["run", "lint:check"]);
run("npm", ["run", "build"]);

#!/usr/bin/env node
import fs from "node:fs";

if (!fs.existsSync("package-lock.json")) {
  console.log("package-lock.json: MISSING");
  console.log("STATUS: BLOCKED LOCALLY — this environment cannot reach npm.");
  console.log("REMEDIATION: run `npm run bootstrap:certify` in a networked environment or run the GitHub Actions certification workflow.");
  process.exitCode = 2;
} else {
  const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
  console.log(`package-lock.json: FOUND`);
  console.log(`lockfileVersion: ${lock.lockfileVersion ?? "unknown"}`);
  console.log(`packages entries: ${Object.keys(lock.packages ?? {}).length}`);
  console.log("STATUS: READY FOR npm ci");
}

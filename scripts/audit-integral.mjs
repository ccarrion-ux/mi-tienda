#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const src = path.join(root, "src");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, e.name);
    e.isDirectory() ? out.push(...walk(p)) : out.push(p);
  }
  return out;
}
const files = walk(src);
const code = files.filter(f=>/\.(ts|tsx|js|jsx|mjs)$/.test(f))
  .map(f=>fs.readFileSync(f,"utf8")).join("\n");

const checks = [];
const add = (name, ok, detail="") => checks.push({name, ok, detail});

add("package.json valid", true);
add("no stores[0]", !/stores\s*\[\s*0\s*\]/.test(code));
add("no hardcoded DATABASE_URL", !/postgresql:\/\/[^"'`\s]+/.test(code));
add("no exposed secret literals", !/(sk-[A-Za-z0-9]{20,}|BEGIN PRIVATE KEY)/.test(code));
add("API routes present", files.some(f=>f.includes(`${path.sep}api${path.sep}`)));
add("AUTH_SECRET declared", fs.readFileSync(path.join(root,".env.example"),"utf8").includes("AUTH_SECRET="));
add("NEXT_PUBLIC_APP_URL declared", fs.readFileSync(path.join(root,".env.example"),"utf8").includes("NEXT_PUBLIC_APP_URL="));
const workflows = fs.existsSync(path.join(root,".github/workflows")) ? fs.readdirSync(path.join(root,".github/workflows")) : [];
add("one-shot certification workflow exists", workflows.includes("100-certificacion-final.yml"));

const requiredScripts = ["build","typecheck","lint:check","smoke","check:multistore","audit:active-store","audit:store-isolation","audit:release:static","regression:static","pilot:check"];
add("required npm scripts", requiredScripts.every(s=>pkg.scripts?.[s]));

for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
const failed = checks.filter(c=>!c.ok);
console.log(`INTEGRAL STATIC AUDIT: ${failed.length ? "FAIL" : "PASS"}`);
process.exitCode = failed.length ? 1 : 0;

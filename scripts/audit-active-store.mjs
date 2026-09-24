import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");
const ignore = new Set([path.resolve(root, "lib/store-context.ts")]);
const hits = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx)$/.test(name) && !ignore.has(p)) {
      const text = fs.readFileSync(p, "utf8");
      if (/prisma\.store\.findFirst\(\s*\{\s*where:\s*\{\s*ownerId:\s*(userId|user\.id)\s*\}/.test(text)) {
        hits.push(path.relative(process.cwd(), p));
      }
    }
  }
}
walk(root);
console.log(`Endpoints con selección de primera tienda por ownerId: ${hits.length}`);
for (const hit of hits.sort()) console.log(`- ${hit}`);
process.exitCode = hits.length ? 2 : 0;

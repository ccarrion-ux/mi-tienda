import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");
const findings = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) {
      const text = fs.readFileSync(p, "utf8");
      if (text.includes("stores[0]")) findings.push(path.relative(process.cwd(), p));
    }
  }
}
walk(root);

console.log(`Archivos con stores[0]: ${findings.length}`);
for (const f of findings) console.log(`- ${f}`);
if (findings.length) process.exitCode = 2;

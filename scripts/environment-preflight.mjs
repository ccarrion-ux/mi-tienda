import fs from 'node:fs';
import { execSync } from 'node:child_process';

const results = [];
const add = (name, status, detail='') => results.push({name,status,detail});
const run = (cmd) => execSync(cmd, {encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();

try {
  const node = run('node --version');
  add('Node.js', /^v(20|22)\./.test(node) ? 'PASS' : 'WARN', `${node} — CI usa Node 22`);
} catch { add('Node.js','FAIL','Node no disponible'); }

try {
  const npm = run('npm --version');
  add('npm', /^10\./.test(npm) ? 'PASS' : 'WARN', `${npm} — se recomienda npm 10 en CI`);
} catch { add('npm','FAIL','npm no disponible'); }

add('package.json', fs.existsSync('package.json') ? 'PASS' : 'FAIL');
add('package-lock.json', fs.existsSync('package-lock.json') ? 'PASS' : 'BLOCKED', fs.existsSync('package-lock.json') ? 'Lockfile presente' : 'Falta generar el lockfile en un entorno con red');
add('.npmrc', fs.existsSync('.npmrc') ? 'PASS' : 'WARN');
add('Prisma schema', fs.existsSync('prisma/schema.prisma') ? 'PASS' : 'FAIL');
add('CI workflow', fs.existsSync('.github/workflows/production-check.yml') ? 'PASS' : 'FAIL');

console.log('=== MI TIENDA · ENVIRONMENT PREFLIGHT ===');
for (const r of results) console.log(`${r.status.padEnd(7)} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
console.log('\nSiguiente paso para desbloquear CI: npm run lockfile:prepare');
process.exitCode = results.some(r => r.status === 'FAIL') ? 1 : 0;

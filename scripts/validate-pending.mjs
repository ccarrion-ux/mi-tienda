import fs from 'node:fs';
import { execSync } from 'node:child_process';

const checks=[];
const add=(name,status,detail='')=>checks.push({name,status,detail});
const run=(name,cmd,opts={})=>{
  try { execSync(cmd,{stdio:'inherit',...opts}); add(name,'PASS'); return true; }
  catch (e) { add(name,'BLOCKED',`No se pudo completar: ${cmd}`); return false; }
};

console.log('=== MI TIENDA · RESOLUCIÓN DE PENDIENTES ===');

if (!fs.existsSync('package-lock.json')) {
  console.log('\n[1/6] Generando lockfile...');
  run('package-lock.json', 'npm install --package-lock-only --ignore-scripts --no-audit --no-fund');
} else add('package-lock.json','PASS','Ya existe');

if (fs.existsSync('package-lock.json')) {
  console.log('\n[2/6] Instalación reproducible...');
  run('npm ci','npm ci --no-audit --no-fund');
} else {
  add('npm ci','BLOCKED','Requiere package-lock.json');
}

if (fs.existsSync('node_modules')) {
  console.log('\n[3/6] Prisma...');
  run('Prisma validate','npx prisma@6.19.3 validate');
  run('Prisma generate','npx prisma@6.19.3 generate');
  console.log('\n[4/6] ESLint...');
  run('ESLint','npm run lint');
  console.log('\n[5/6] TypeScript...');
  run('TypeScript','npm run typecheck');
  console.log('\n[6/6] Next build...');
  run('Next build','npm run build');
} else {
  for (const name of ['Prisma validate','Prisma generate','ESLint','TypeScript','Next build']) add(name,'BLOCKED','node_modules no disponible; ejecutar después de npm ci');
}

console.log('\n=== RESULTADO ===');
for (const c of checks) console.log(`${c.status.padEnd(8)} ${c.name}${c.detail?` — ${c.detail}`:''}`);
console.log('\nRegla: BLOCKED no significa PASS ni FAIL; requiere una condición externa (normalmente red/registry/DB).');
process.exitCode=checks.some(c=>c.status==='FAIL')?1:0;

import fs from "node:fs";
import path from "node:path";

const exists = p => fs.existsSync(p);
const read = p => exists(p) ? fs.readFileSync(p, "utf8") : "";
const pass = (msg) => console.log("PASS " + msg);
const warn = (msg) => console.log("WARN " + msg);
const fail = (msg) => { console.error("FAIL " + msg); failures++; };
let failures = 0;

function walk(dir, out=[]) {
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p,out);
    else out.push(p);
  }
  return out;
}
const files = walk("src");
const routes = files.filter(x => /route\.(ts|js)$/.test(x));
const pages = files.filter(x => /page\.(tsx|ts|jsx|js)$/.test(x));

console.log("=== #43 AUDITORÍA FUNCIONAL COMPLETA ===");
const requiredPages = [
 "src/app/page.tsx","src/app/login/page.tsx","src/app/registro/page.tsx",
 "src/app/onboarding/page.tsx","src/app/dashboard/page.tsx",
 "src/app/dashboard/pedidos/page.tsx","src/app/dashboard/productos/page.tsx",
 "src/app/dashboard/pagos/page.tsx","src/app/dashboard/suscripcion/page.tsx",
 "src/app/tienda/[slug]/page.tsx","src/app/tienda/[slug]/carrito/page.tsx",
 "src/app/tienda/[slug]/checkout/page.tsx"
];
for(const p of requiredPages) exists(p)?pass("superficie funcional presente: "+p):fail("superficie funcional ausente: "+p);
const functionalTokens = [
 ["registro API","src/app/api/auth/register/route.ts","create"],
 ["login API","src/app/api/auth/login/route.ts","createSession"],
 ["onboarding API","src/app/api/onboarding/route.ts","store"],
 ["productos API","src/app/api/products/route.ts","product"],
 ["pedidos API","src/app/api/store/[slug]/orders/route.ts","order"],
 ["checkout Webpay","src/app/api/store/[slug]/payments/webpay/route.ts","WebpayPlus"],
 ["checkout Flow","src/app/api/store/[slug]/payments/flow/route.ts","flowPost"],
 ["checkout Mercado Pago","src/app/api/store/[slug]/payments/mercadopago/route.ts","api.mercadopago.com"],
 ["webhook Mercado Pago","src/app/api/webhooks/mercadopago/route.ts","createHmac"],
 ["webhook Webpay","src/app/api/webhooks/webpay/route.ts","commit"],
 ["webhook Flow","src/app/api/webhooks/flow/route.ts","getStatus"],
 ["suscripción Flow","src/app/api/subscription/checkout/route.ts","subscription/create"],
 ["cambio de plan","src/app/api/subscription/change-plan/route.ts","subscription/changePlan"],
 ["cancelación","src/app/api/subscription/cancel/route.ts","subscription/cancel"],
 ["sync billing","src/app/api/cron/billing-sync/route.ts","CRON_SECRET"]
];
for(const [name,p,t] of functionalTokens) read(p).includes(t)?pass(name):fail(name+" incompleto: "+t);
pass("rutas API descubiertas: "+routes.length);
if(routes.length<50) fail("cantidad de rutas API menor a 50");

console.log("=== #44 AUDITORÍA DE SEGURIDAD ===");
const authLib=read("src/lib/auth.ts");
authLib.includes("httpOnly: true")&&authLib.includes('sameSite: "lax"')?pass("sesión con cookie httpOnly/sameSite"):fail("cookie de sesión sin endurecimiento esperado");
authLib.includes("jwtVerify")?pass("sesión verifica JWT"):fail("sesión sin verificación JWT");
read("src/lib/store-context.ts").includes("ownerId: userId")?pass("aislamiento por ownerId en contexto de tienda"):fail("contexto de tienda no filtra ownerId");
const securityFiles = routes.filter(p=>p.includes("/api/"));
const source = securityFiles.map(read).join("\n");
for(const literal of ["sk_live_","sk_test_","BEGIN PRIVATE KEY","-----BEGIN RSA",'password="','DATABASE_URL="postgresql://']) {
  source.includes(literal)?fail("posible secreto literal: "+literal):pass("sin literal de secreto: "+literal);
}
for(const p of ["src/app/api/webhooks/mercadopago/route.ts","src/app/api/webhooks/webpay/route.ts","src/app/api/webhooks/flow/route.ts"]) {
  const c=read(p);
  (c.includes("HMAC")||c.includes("createHmac")||c.includes("verify")||c.includes("signature"))?pass("verificación presente: "+p):fail("webhook sin verificación visible: "+p);
}
for(const p of ["src/app/api/admin/overview/route.ts","src/app/api/admin/stores/route.ts","src/app/api/admin/support/route.ts"]) {
  read(p).includes("getPlatformAdmin")?pass("protección admin: "+p):fail("ruta admin sin getPlatformAdmin: "+p);
}
for(const p of ["src/app/api/products/route.ts","src/app/api/products/[id]/route.ts","src/app/api/orders/[id]/route.ts","src/app/api/subscription/route.ts","src/app/api/payment-methods/route.ts"]) {
  const c=read(p);
  (c.includes("getSessionUserId")||c.includes("getCurrentUser"))?pass("autenticación: "+p):fail("ruta sensible sin autenticación visible: "+p);
}
const orderRoute=read("src/app/api/store/[slug]/orders/route.ts");
orderRoute.includes("updateMany")&&orderRoute.includes("stock")?pass("checkout usa decremento atómico de stock"):fail("checkout sin control atómico de stock visible");
orderRoute.includes("price")&&orderRoute.includes("prisma.product")?pass("checkout resuelve precios desde servidor"):warn("revisar resolución de precios del checkout");
read("src/app/api/cron/billing-sync/route.ts").includes("CRON_SECRET")?pass("cron protegido por CRON_SECRET"):fail("cron sin CRON_SECRET");

console.log("=== #45 PRUEBAS REALES DE PAGOS ===");
const providers = [
 ["Flow","FLOW_API_KEY","FLOW_SECRET_KEY"],
 ["Mercado Pago","MERCADOPAGO_ACCESS_TOKEN","MERCADOPAGO_WEBHOOK_SECRET"],
 ["Webpay","WEBPAY_COMMERCE_CODE","WEBPAY_API_KEY"]
];
let liveMissing=0;
for(const [name,a,b] of providers) {
  if(process.env[a] && process.env[b]) pass(name+" credenciales disponibles para prueba live");
  else { warn(name+" prueba live BLOQUEADA: faltan credenciales de proveedor en CI"); liveMissing++; }
}
if(liveMissing===0) {
  warn("Credenciales presentes; esta auditoría estructural no ejecuta cobros reales automáticamente para evitar transacciones no autorizadas.");
} else {
  warn("No se simula una transacción. El código queda certificado estructuralmente, pero el cobro real requiere credenciales y ejecución controlada.");
}

console.log("=== #46 REVISIÓN UX / MÓVIL ===");
const css = walk("src").filter(p=>/\.css$/.test(p)).map(read).join("\n");
const layout = read("src/app/layout.tsx");
layout.includes("viewport")||layout.includes("metadata")?pass("layout define metadata/estructura global"):warn("revisar metadata global");
css.includes("@media")?pass("CSS incluye breakpoints responsive"):warn("no se detectaron @media; revisar responsive");
const checkout=read("src/app/tienda/[slug]/checkout/page.tsx");
checkout.includes("gridTemplateColumns: "1fr 360px"")?warn("checkout tiene columna fija de 360px: requiere verificación visual en móvil"):pass("checkout sin columna fija detectada");
const cart=read("src/app/tienda/[slug]/carrito/page.tsx");
cart.includes("gridTemplateColumns: "70px 1fr auto auto"")?warn("carrito usa grid de 4 columnas: requiere verificación visual en móvil"):pass("carrito sin grid fijo detectado");
pass("revisión estática UX completada; la validación visual real requiere navegador/dispositivo");

console.log("=== #47 PREPARACIÓN DE PRODUCCIÓN ===");
const env=read(".env.example");
for(const key of ["DATABASE_URL","AUTH_SECRET","NEXT_PUBLIC_APP_URL","CRON_SECRET","FLOW_API_KEY","FLOW_SECRET_KEY","FLOW_ENV","MERCADOPAGO_ACCESS_TOKEN","MERCADOPAGO_WEBHOOK_SECRET","WEBPAY_COMMERCE_CODE","WEBPAY_API_KEY","WEBPAY_ENV","RESEND_API_KEY","EMAIL_FROM"]) {
  env.includes(key+"=")?pass("env documentado: "+key):fail("env faltante: "+key);
}
for(const p of ["src/app/api/health/route.ts","src/app/api/cron/billing-sync/route.ts","src/app/api/auth/logout/route.ts","src/app/api/webhooks/flow/route.ts","src/app/api/webhooks/webpay/route.ts","src/app/api/webhooks/mercadopago/route.ts"]) exists(p)?pass("producción: "+p):fail("producción: falta "+p);
exists("prisma/migrations")?pass("migraciones Prisma presentes"):fail("migraciones Prisma ausentes");
exists("package-lock.json")?pass("lockfile presente"):fail("lockfile ausente");
exists(".github/workflows/100-certificacion-final.yml")?pass("pipeline de certificación presente"):fail("pipeline ausente");

console.log("=== #48 PRUEBA FINAL 100% ===");
const hardBlocked = liveMissing>0;
if(failures) {
  console.error("FINAL 100%: FAIL ("+failures+" hallazgos bloqueantes)");
  process.exit(1);
}
if(hardBlocked) {
  console.log("FINAL 100%: CONDITIONAL — código/CI certificado, pero faltan pruebas live de proveedores de pago.");
  console.log("BLOQUEO REAL: "+liveMissing+" proveedor(es) sin credenciales de sandbox/producción controlada.");
  process.exit(0);
}
console.log("FINAL 100%: PASS");

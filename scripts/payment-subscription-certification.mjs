import fs from "node:fs";

const requiredFiles = [
  "src/lib/flow.ts",
  "src/lib/flow-saas.ts",
  "src/lib/webpay.ts",
  "src/app/api/subscription/checkout/route.ts",
  "src/app/api/subscription/callback/route.ts",
  "src/app/api/subscription/change-plan/route.ts",
  "src/app/api/subscription/cancel/route.ts",
  "src/app/api/store/[slug]/payments/mercadopago/route.ts",
  "src/app/api/store/[slug]/payments/webpay/route.ts",
  "src/app/api/store/[slug]/payments/flow/route.ts",
  "src/app/api/webhooks/mercadopago/route.ts",
  "src/app/api/webhooks/webpay/route.ts",
  "src/app/api/webhooks/flow/route.ts",
  "prisma/schema.prisma"
];

const requiredEnv = [
  "FLOW_API_KEY", "FLOW_SECRET_KEY", "FLOW_ENV",
  "MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_WEBHOOK_SECRET",
  "WEBPAY_COMMERCE_CODE", "WEBPAY_API_KEY", "WEBPAY_ENV"
];

const failures = [];
const pass = (msg) => console.log(`PASS ${msg}`);
const fail = (msg) => { console.error(`FAIL ${msg}`); failures.push(msg); };

for (const file of requiredFiles) {
  fs.existsSync(file) ? pass(`archivo presente: ${file}`) : fail(`archivo ausente: ${file}`);
}

let schema = "";
try { schema = fs.readFileSync("prisma/schema.prisma", "utf8"); } catch {}
for (const token of [
  "model Subscription", "model BillingEvent", "externalCustomerId",
  "externalSubscriptionId", "cancelAtPeriodEnd", "model Payment",
  "MERCADOPAGO", "WEBPAY", "FLOW"
]) {
  schema.includes(token)
    ? pass(`modelo/configuración presente: ${token}`)
    : fail(`modelo/configuración ausente: ${token}`);
}

let envExample = "";
try { envExample = fs.readFileSync(".env.example", "utf8"); } catch {}
for (const key of requiredEnv) {
  envExample.includes(`${key}=`)
    ? pass(`variable declarada: ${key}`)
    : fail(`variable no declarada: ${key}`);
}

const checks = [
  ["Flow firma HMAC", "src/lib/flow.ts", "createHmac"],
  ["Flow capa SaaS", "src/lib/flow-saas.ts", "flowSaaSPost"],
  ["Flow registro cliente", "src/app/api/subscription/checkout/route.ts", "/customer/register"],
  ["Flow creación suscripción", "src/app/api/subscription/checkout/route.ts", "/subscription/create"],
  ["Flow cambio de plan", "src/app/api/subscription/change-plan/route.ts", "/subscription/changePlan"],
  ["Flow cancelación", "src/app/api/subscription/cancel/route.ts", "/subscription/cancel"],
  ["Webpay SDK", "src/lib/webpay.ts", "WebpayPlus.Transaction"],
  ["Mercado Pago API", "src/app/api/store/[slug]/payments/mercadopago/route.ts", "api.mercadopago.com"],
  ["Mercado Pago firma webhook", "src/app/api/webhooks/mercadopago/route.ts", "createHmac"],
  ["Webpay commit", "src/app/api/webhooks/webpay/route.ts", ".commit("],
  ["Flow payment status", "src/app/api/webhooks/flow/route.ts", "/payment/getStatus"]
];

for (const [name, file, token] of checks) {
  let content = "";
  try { content = fs.readFileSync(file, "utf8"); } catch {}
  content.includes(token) ? pass(name) : fail(`${name}: no se encontró ${token}`);
}

if (failures.length) {
  console.error(`PAYMENT/SUBSCRIPTION CERTIFICATION: FAIL (${failures.length})`);
  process.exit(1);
}
console.log("PAYMENT/SUBSCRIPTION CERTIFICATION: PASS");
console.log("Nota: la transacción real de sandbox requiere credenciales del proveedor; esta prueba no simula cobros.");

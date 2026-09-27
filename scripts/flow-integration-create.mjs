import crypto from "node:crypto";
import querystring from "node:querystring";

const apiKey = process.env.FLOW_API_KEY;
const secretKey = process.env.FLOW_SECRET_KEY;

if (!apiKey || !secretKey) {
  console.error("FLOW INTEGRATION CREATE: BLOCKED");
  console.error("Faltan FLOW_API_KEY y/o FLOW_SECRET_KEY.");
  process.exit(1);
}

const baseUrl =
  process.env.FLOW_ENV === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";

function sign(params) {
  const normalized = Object.entries(params)
    .filter(([key]) => key !== "s")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}${value}`)
    .join("");

  return crypto.createHmac("sha256", secretKey).update(normalized).digest("hex");
}

async function flowPost(path, params) {
  const body = { ...params, s: sign(params) };
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: querystring.stringify(body),
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = null; }

  if (!response.ok || !data) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 500)}`);
  }
  return data;
}

const commerceOrder = `MT-FLOW-CI-${Date.now()}`;
const create = await flowPost("/payment/create", {
  apiKey,
  commerceOrder,
  urlConfirmation: "https://example.com/mi-tienda-flow-confirmation",
  urlReturn: "https://example.com/mi-tienda-flow-return",
  email: "test@example.com",
  subject: "Mi Tienda integration certification",
  amount: 1000,
});

if (!create.token || !create.url || !create.flowOrder) {
  throw new Error("Flow /payment/create no devolvió token, url y flowOrder.");
}

const status = await flowPost("/payment/getStatus", {
  apiKey,
  token: create.token,
});

if (typeof status.status === "undefined") {
  throw new Error("Flow /payment/getStatus no devolvió status.");
}

console.log("FLOW INTEGRATION CREATE: PASS");
console.log(`commerceOrder=${commerceOrder}`);
console.log(`flowOrder=${create.flowOrder}`);
console.log(`token=received`);
console.log(`status=${status.status}`);
console.log("No se realizó un cobro ni se ingresaron datos de tarjeta.");

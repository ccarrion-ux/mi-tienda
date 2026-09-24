import { flowBaseUrl, flowSignedParams } from "@/lib/flow";

function requireFlow() {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) throw new Error("FLOW_API_KEY y FLOW_SECRET_KEY son obligatorios para facturación SaaS.");
  return { apiKey, secretKey };
}

export async function flowSaaSPost(path: string, params: Record<string, string | number>) {
  const { apiKey } = requireFlow();
  const signed = flowSignedParams({ apiKey, ...params });
  const body = new URLSearchParams();
  Object.entries(signed).forEach(([k, v]) => body.set(k, String(v)));
  const res = await fetch(`${flowBaseUrl()}${path}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.message || data?.error || `Flow HTTP ${res.status}`);
  return data;
}

export async function flowSaaSGet(path: string, params: Record<string, string | number>) {
  const { apiKey } = requireFlow();
  const signed = flowSignedParams({ apiKey, ...params });
  const qs = new URLSearchParams();
  Object.entries(signed).forEach(([k, v]) => qs.set(k, String(v)));
  const res = await fetch(`${flowBaseUrl()}${path}?${qs.toString()}`, { cache: "no-store" });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.message || data?.error || `Flow HTTP ${res.status}`);
  return data;
}

export function flowPlanId(code: string, interval: "MONTHLY" | "YEARLY") {
  const key = `FLOW_SAAS_PLAN_${code}_${interval}`;
  const value = process.env[key];
  if (!value) throw new Error(`Falta ${key} en las variables de entorno.`);
  return value;
}

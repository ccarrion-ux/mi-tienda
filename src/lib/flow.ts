import crypto from "node:crypto";

export function flowBaseUrl() {
  return process.env.FLOW_ENV === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";
}

export function flowSign(params: Record<string, string | number>) {
  const secret = process.env.FLOW_SECRET_KEY;
  if (!secret) throw new Error("FLOW_SECRET_KEY no configurada.");

  const normalized = Object.entries(params)
    .filter(([key]) => key !== "s")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}${value}`)
    .join("");

  return crypto.createHmac("sha256", secret).update(normalized).digest("hex");
}

export function flowSignedParams(params: Record<string, string | number>) {
  return { ...params, s: flowSign(params) };
}

export async function sendEmail(input: { to: string; subject: string; html: string; idempotencyKey?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { skipped: true, reason: "RESEND_API_KEY o EMAIL_FROM no configurados" };
  const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
  if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;
  const res = await fetch("https://api.resend.com/emails", { method: "POST", headers, body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error de email HTTP ${res.status}`);
  return data;
}

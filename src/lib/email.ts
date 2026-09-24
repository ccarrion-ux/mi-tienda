export type EmailMessage = { to: string; subject: string; html: string };

export function trialStartedEmail(input: { name: string; storeName: string; trialDays: number }): EmailMessage {
  return { to: "", subject: `Tu prueba de Mi Tienda comenzó`, html: `<h1>Hola ${escapeHtml(input.name)}</h1><p>Tu tienda <strong>${escapeHtml(input.storeName)}</strong> tiene ${input.trialDays} días de prueba.</p><p>Configura productos, pagos, despacho y diseño antes de publicar.</p>` };
}
export function orderCreatedEmail(input: { customerName: string; orderNumber: number; total: number }): EmailMessage {
  return { to: "", subject: `Pedido #${input.orderNumber} recibido`, html: `<h1>Gracias, ${escapeHtml(input.customerName)}</h1><p>Recibimos tu pedido <strong>#${input.orderNumber}</strong>.</p><p>Total: $${Math.round(input.total).toLocaleString("es-CL")}</p>` };
}
export function escapeHtml(value: string) { return value.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!)); }

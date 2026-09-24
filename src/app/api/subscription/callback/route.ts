import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { flowSaaSGet, flowSaaSPost, flowPlanId } from "@/lib/flow-saas";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token") || "");
  if (!token) return NextResponse.redirect(new URL("/dashboard/facturacion?billing=error", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  try {
    const status = await flowSaaSGet("/customer/getRegisterStatus", { token });
    const customerId = String(status.customerId || "");
    if (!customerId || String(status.status) !== "1") throw new Error("Registro de tarjeta no confirmado.");
    const sub = await prisma.subscription.findFirst({ where: { externalCustomerId: customerId }, include: { plan: true, store: { include: { owner: true } } } });
    if (!sub) throw new Error("Suscripción local no encontrada.");
    const remotePlan = flowPlanId(sub.plan.code, sub.billingInterval);
    const remote = sub.externalSubscriptionId ? null : await flowSaaSPost("/subscription/create", { planId: remotePlan, customerId, trial_period_days: 30 });
    const updated = await prisma.subscription.update({ where: { id: sub.id }, data: { externalSubscriptionId: remote?.subscriptionId || remote?.sub_id || sub.externalSubscriptionId, status: "TRIALING", trialEndAt: new Date(Date.now() + 30*24*60*60*1000) } });
    await sendEmail({ to: sub.store.owner.email, subject: "Tu facturación de Mi Tienda está configurada", html: `<h1>Facturación configurada</h1><p>La tarjeta de tu cuenta quedó registrada para el plan <strong>${sub.plan.name}</strong>.</p><p>Tu período de prueba continúa según las condiciones de tu cuenta.</p>`, idempotencyKey: `billing-configured-${updated.id}` }).catch((_error: unknown): null => null);
    return NextResponse.redirect(new URL("/dashboard/facturacion?billing=ok", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  } catch {
    return NextResponse.redirect(new URL("/dashboard/facturacion?billing=error", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
}

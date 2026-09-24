import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { flowSaaSGet, flowSaaSPost, flowPlanId } from "@/lib/flow-saas";
import { getActiveStoreId } from "@/lib/store-context";

function appUrl() { return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; }
function addMonths(date: Date, months: number) { const d = new Date(date); d.setMonth(d.getMonth() + months); return d; }
function addYears(date: Date, years: number) { const d = new Date(date); d.setFullYear(d.getFullYear() + years); return d; }

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const code = String(body.planCode || "STARTER").toUpperCase();
  const interval = body.billingInterval === "YEARLY" ? "YEARLY" : "MONTHLY";
  if (code === "FREE" || code === "ENTERPRISE") return NextResponse.json({ error: "Este plan no usa este checkout automático." }, { status: 400 });
  const store = await prisma.store.findFirst({ where: { id: activeStoreId }, include: { subscription: true, owner: true } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  const plan = await prisma.saaSPlan.findUnique({ where: { code: code as any } });
  if (!plan || !plan.active) return NextResponse.json({ error: "Plan no disponible" }, { status: 400 });
  const flowPlan = flowPlanId(code, interval);
  const current = store.subscription || await prisma.subscription.create({ data: { storeId: store.id, planId: plan.id, status: "TRIALING", billingInterval: interval as any, trialStartAt: new Date(), trialEndAt: addMonths(new Date(), 1), currentPeriodStart: new Date(), currentPeriodEnd: addMonths(new Date(), 1) } });
  const subscription = await prisma.subscription.update({ where: { id: current.id }, data: { planId: plan.id, billingInterval: interval as any, cancelAtPeriodEnd: false }, include: { plan: true } });

  let customerId = subscription.externalCustomerId;
  if (!customerId) {
    const customer = await flowSaaSPost("/customer/create", { name: store.owner.name, email: store.owner.email, externalId: store.id });
    customerId = customer.customerId;
    await prisma.subscription.update({ where: { id: subscription.id }, data: { externalCustomerId: customerId } });
  }

  try {
    const customer = await flowSaaSGet("/customer/get", { customerId });
    if (String(customer.status) !== "1") {
      const reg = await flowSaaSPost("/customer/register", { customerId, url_return: `${appUrl()}/api/subscription/callback` });
      return NextResponse.json({ redirectUrl: `${reg.url}?token=${encodeURIComponent(reg.token)}`, mode: "card_registration" });
    }
  } catch {
    const reg = await flowSaaSPost("/customer/register", { customerId, url_return: `${appUrl()}/api/subscription/callback` });
    return NextResponse.json({ redirectUrl: `${reg.url}?token=${encodeURIComponent(reg.token)}`, mode: "card_registration" });
  }

  if (!subscription.externalSubscriptionId) {
    const remote = await flowSaaSPost("/subscription/create", { planId: flowPlan, customerId, trial_period_days: 30 });
    await prisma.subscription.update({ where: { id: subscription.id }, data: { externalSubscriptionId: remote.subscriptionId || remote.sub_id, status: "TRIALING", trialEndAt: addMonths(new Date(), 1) } });
  }
  return NextResponse.json({ ok: true, mode: "subscribed" });
}

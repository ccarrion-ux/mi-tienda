import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";

export async function GET() {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso de administrador requerido" }, { status: 403 });

  const [stores, subscriptions, plans, recentOrders] = await Promise.all([
    prisma.store.findMany({
      select: { id: true, name: true, slug: true, status: true, createdAt: true, ownerId: true, owner: { select: { email: true, name: true } }, subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findMany({ include: { plan: true } }),
    prisma.saaSPlan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.order.findMany({ select: { total: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 500 }),
  ]);

  const now = Date.now();
  const trialing = subscriptions.filter(x => x.status === "TRIALING" && new Date(x.trialEndAt).getTime() >= now).length;
  const paid = subscriptions.filter(x => x.status === "ACTIVE").length;
  const cancelled = subscriptions.filter(x => x.status === "CANCELLED" || x.status === "EXPIRED").length;

  const mrr = subscriptions
    .filter(x => x.status === "ACTIVE" && x.billingInterval === "MONTHLY")
    .reduce((sum, x) => sum + Number(x.plan.monthlyPrice), 0)
    + subscriptions
      .filter(x => x.status === "ACTIVE" && x.billingInterval === "YEARLY")
      .reduce((sum, x) => sum + Number(x.plan.yearlyPrice) / 12, 0);

  const last30 = new Date(Date.now() - 30 * 86400000);
  const orders30 = recentOrders.filter(x => new Date(x.createdAt) >= last30 && x.status !== "CANCELLED");
  const storeRows = stores.map(s => ({
    id: s.id, name: s.name, slug: s.slug, owner: s.owner?.name || s.owner?.email || "—",
    createdAt: s.createdAt, plan: s.subscription?.plan?.name || "Sin plan",
    subscriptionStatus: s.subscription?.status || "—",
    storeStatus: s.status,
    trialEndAt: s.subscription?.trialEndAt || null,
  }));

  return NextResponse.json({
    admin: { email: admin.user.email, role: admin.role },
    metrics: {
      totalStores: stores.length,
      activeStores: stores.filter(s => s.status === "ACTIVE").length,
      trialing,
      paid,
      cancelled,
      mrr: Number(mrr.toFixed(2)),
      orders30: orders30.length,
      sales30: Number(orders30.reduce((sum, x) => sum + Number(x.total), 0).toFixed(2)),
    },
    plans: plans.map(p => ({ code: p.code, name: p.name, price: Number(p.monthlyPrice), subscriptions: subscriptions.filter(s => s.planId === p.id).length })),
    stores: storeRows.slice(0, 50),
  });
}

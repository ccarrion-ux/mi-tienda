import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const activeStoreId = await getActiveStoreId(user.id);

  const store = await prisma.store.findFirst({ where: { id: activeStoreId || "", ownerId: user.id, status: "ACTIVE" }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  let subscription = await prisma.subscription.findUnique({ where: { storeId: store.id }, include: { plan: true } });

  if (!subscription) {
    const starter = await prisma.saaSPlan.findUnique({ where: { code: "STARTER" } });
    if (!starter) return NextResponse.json({ error: "Planes no configurados" }, { status: 500 });
    const now = new Date();
    subscription = await prisma.subscription.create({
      data: {
        storeId: store.id,
        planId: starter.id,
        status: "TRIALING",
        billingInterval: "MONTHLY",
        trialStartAt: now,
        trialEndAt: addMonths(now, 1),
        currentPeriodStart: now,
        currentPeriodEnd: addMonths(now, 1),
      },
      include: { plan: true },
    });
  }

  return NextResponse.json(subscription);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const activeStoreId = await getActiveStoreId(user.id);
  const body = await req.json().catch(() => ({}));
  const planCode = body.planCode;
  const interval = body.billingInterval === "YEARLY" ? "YEARLY" : "MONTHLY";

  const store = await prisma.store.findFirst({ where: { id: activeStoreId || "", ownerId: user.id, status: "ACTIVE" }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const plan = await prisma.saaSPlan.findUnique({ where: { code: planCode } });
  if (!plan || !plan.active) return NextResponse.json({ error: "Plan no disponible" }, { status: 400 });

  const existing = await prisma.subscription.findUnique({ where: { storeId: store.id } });
  if (!existing) return NextResponse.json({ error: "La suscripción aún no fue inicializada" }, { status: 400 });

  // Plan changes are recorded here; actual recurring collection is connected in the billing phase.
  const updated = await prisma.subscription.update({
    where: { storeId: store.id },
    data: { planId: plan.id, billingInterval: interval, cancelAtPeriodEnd: false },
    include: { plan: true },
  });

  return NextResponse.json(updated);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

const providers = ["FLOW", "WEBPAY", "MERCADOPAGO", "TRANSFER", "TEST"] as const;

export async function GET() {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const store = await prisma.store.findFirst({ where: { id: activeStoreId } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const configs = await prisma.paymentMethodConfig.findMany({ where: { storeId: store.id } });
  const map = new Map(configs.map(c => [c.provider, c]));

  return NextResponse.json({
    paymentMethods: providers.map(provider => ({
      provider,
      enabled: map.get(provider)?.enabled ?? provider === "TRANSFER",
      displayName: map.get(provider)?.displayName || null
    }))
  });
}

export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const activeStoreId = await getActiveStoreId(userId);

  const store = await prisma.store.findFirst({ where: { id: activeStoreId || "", ownerId: userId, status: "ACTIVE" } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const body = await req.json();
  const provider = String(body.provider || "");
  const enabled = Boolean(body.enabled);

  if (!providers.includes(provider as typeof providers[number])) {
    return NextResponse.json({ error: "Proveedor no válido." }, { status: 400 });
  }

  const config = await prisma.paymentMethodConfig.upsert({
    where: { storeId_provider: { storeId: store.id, provider: provider as any } },
    create: { storeId: store.id, provider: provider as any, enabled },
    update: { enabled }
  });

  return NextResponse.json({ paymentMethod: config });
}

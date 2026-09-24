import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

export async function GET() {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const store = await prisma.store.findFirst({
    where: { id: activeStoreId },
    include: { shippingMethods: { orderBy: { createdAt: "desc" } } }
  });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  return NextResponse.json({
    shippingMethods: store.shippingMethods.map(m => ({
      ...m,
      price: Number(m.price)
    }))
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const store = await prisma.store.findFirst({ where: { id: activeStoreId } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const price = Number(body.price);

  if (!name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "El precio de despacho no es válido." }, { status: 400 });
  }

  const method = await prisma.shippingMethod.create({
    data: { storeId: store.id, name, description: description || null, price }
  });

  return NextResponse.json({ shippingMethod: { ...method, price: Number(method.price) } }, { status: 201 });
}

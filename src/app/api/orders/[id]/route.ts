import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

const allowed = ["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const activeStoreId = await getActiveStoreId(userId);
  const { id } = await params;
  const { status } = await req.json();

  if (!allowed.includes(status)) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { id, storeId: activeStoreId || "" } });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });

  const updated = await prisma.order.update({ where: { id }, data: { status } });
  return NextResponse.json({ order: updated });
}

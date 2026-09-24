import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

async function owned(id: string, userId: string) {
  const activeStoreId = await getActiveStoreId(userId);
  return prisma.shippingMethod.findFirst({
    where: { id, storeId: activeStoreId || "" }
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await params;
  const method = await owned(id, userId);
  if (!method) return NextResponse.json({ error: "Método no encontrado." }, { status: 404 });

  const body = await req.json();
  const data: { name?: string; description?: string | null; price?: number; active?: boolean } = {};

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.description !== undefined) data.description = String(body.description).trim() || null;
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Precio inválido." }, { status: 400 });
    }
    data.price = price;
  }
  if (body.active !== undefined) data.active = Boolean(body.active);

  const updated = await prisma.shippingMethod.update({ where: { id }, data });
  return NextResponse.json({ shippingMethod: { ...updated, price: Number(updated.price) } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await params;
  const method = await owned(id, userId);
  if (!method) return NextResponse.json({ error: "Método no encontrado." }, { status: 404 });

  await prisma.shippingMethod.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

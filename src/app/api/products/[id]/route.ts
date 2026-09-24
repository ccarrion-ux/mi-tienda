import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const activeStoreId = await getActiveStoreId(userId);
  const { id } = await params;

  const product = await prisma.product.findFirst({ where: { id, storeId: activeStoreId || "" } });
  if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });

  try {
    const body = await request.json();
    const price = Number(body.price), stock = Number(body.stock);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0)
      return NextResponse.json({ error: "Precio o stock inválido." }, { status: 400 });

    if (body.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: String(body.categoryId), storeId: activeStoreId || "" } });
      if (!category) return NextResponse.json({ error: "Categoría no autorizada." }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: String(body.name).trim(),
        description: body.description || null,
        price, stock,
        sku: body.sku || null,
        imageUrl: body.imageUrl || null,
        categoryId: body.categoryId || null,
        active: typeof body.active === "boolean" ? body.active : body.active === "true"
      }
    });

    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const activeStoreId = await getActiveStoreId(userId);
  const { id } = await params;

  const product = await prisma.product.findFirst({ where: { id, storeId: activeStoreId || "" } });
  if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

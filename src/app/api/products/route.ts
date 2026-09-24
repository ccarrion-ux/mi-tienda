import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const body = await request.json();
    const store = await prisma.store.findFirst({ where: { id: activeStoreId } });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

    const price = Number(body.price);
    const stock = Number(body.stock);
    if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Precio inválido." }, { status: 400 });
    if (!Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "Stock inválido." }, { status: 400 });

    if (body.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: String(body.categoryId), storeId: store.id } });
      if (!category) return NextResponse.json({ error: "Categoría no autorizada." }, { status: 400 });
    }

    const base = slugify(name) || "producto";
    let slug = base, n = 2;
    while (await prisma.product.findUnique({ where: { storeId_slug: { storeId: store.id, slug } } })) slug = `${base}-${n++}`;

    const product = await prisma.product.create({
      data: {
        name, slug, description: body.description || null, price, stock,
        sku: body.sku || null, imageUrl: body.imageUrl || null,
        categoryId: body.categoryId || null, storeId: store.id
      }
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

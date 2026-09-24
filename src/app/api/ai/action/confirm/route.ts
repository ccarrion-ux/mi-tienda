import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { action, payload } = await req.json();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stores: { include: { categories: true } } },
    });
    const activeStoreId = await getActiveStoreId(userId);
  const store = user?.stores.find(s => s.id === activeStoreId);
    if (!store) return NextResponse.json({ error: "No tienes una tienda." }, { status: 400 });

    if (action === "create_product") {
      const name = String(payload?.name || "").trim();
      const price = Number(payload?.price || 0);
      const stock = Number(payload?.stock || 0);
      if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
        return NextResponse.json({ error: "Datos de producto inválidos." }, { status: 400 });
      }

      const categoryName = String(payload?.categoryName || "").trim();
      const category = categoryName
        ? store.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
        : undefined;

      let slug = slugify(name) || `producto-${Date.now()}`;
      const existing = await prisma.product.findUnique({ where: { storeId_slug: { storeId: store.id, slug } } });
      if (existing) slug = `${slug}-${Date.now().toString().slice(-6)}`;

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description: String(payload?.description || ""),
          price,
          stock,
          sku: payload?.sku ? String(payload.sku) : null,
          categoryId: category?.id || null,
          storeId: store.id,
          active: false,
        },
      });

      await prisma.aIActivityLog.create({ data: {
        storeId: store.id, userId, actionType: "create_product", status: "EXECUTED",
        summary: `IA creó el borrador de producto “${product.name}”`,
        details: { productId: product.id, reversible: false }
      }});
      return NextResponse.json({
        ok: true,
        message: "Producto creado como borrador. Debe revisarse antes de publicarlo.",
        productId: product.id,
      });
    }

    if (action === "update_product_description") {
      const productName = String(payload?.productName || "").trim();
      const description = String(payload?.description || "").trim();
      const product = await prisma.product.findFirst({
        where: { storeId: store.id, name: productName },
      });
      if (!product) return NextResponse.json({ error: "No encontré ese producto en tu tienda." }, { status: 404 });

      const previousDescription = product.description;
      await prisma.product.update({ where: { id: product.id }, data: { description } });
      await prisma.aIActivityLog.create({ data: {
        storeId: store.id, userId, actionType: "update_product_description", status: "EXECUTED",
        summary: `IA actualizó la descripción de “${product.name}”`,
        details: { productId: product.id, previousDescription, newDescription: description, reversible: true }
      }});
      return NextResponse.json({ ok: true, message: "Descripción actualizada." });
    }

    if (action === "marketing_draft") {
      await prisma.aIActivityLog.create({ data: {
        storeId: store.id, userId, actionType: "marketing_draft", status: "EXECUTED",
        summary: "IA preparó un borrador de campaña",
        details: { draft: payload, reversible: false }
      }});
      return NextResponse.json({
        ok: true,
        message: "Borrador de campaña preparado. No se publicó ninguna campaña.",
        draft: payload,
      });
    }

    return NextResponse.json({ error: "Acción no permitida." }, { status: 400 });
  } catch (error) {
    console.error("AI action confirmation error", error);
    return NextResponse.json({ error: "No fue posible ejecutar la acción." }, { status: 500 });
  }
}

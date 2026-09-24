import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const activeStoreId = await getActiveStoreId(user.id);

  const store = await prisma.store.findFirst({
    where: { id: activeStoreId },
    include: {
      products: { select: { id: true } },
      categories: { select: { id: true } },
      paymentMethods: { where: { enabled: true }, select: { id: true } },
      shippingMethods: { where: { active: true }, select: { id: true } },
      theme: { select: { published: true } },
      subscription: { include: { plan: true } },
    },
  });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const checklist = [
    { id: "store", title: "Crear tu tienda", done: true, href: "/dashboard" },
    { id: "design", title: "Personalizar el diseño", done: !!store.theme, href: "/dashboard/diseno" },
    { id: "products", title: "Agregar tu primer producto", done: store.products.length > 0, href: "/dashboard/productos/nuevo" },
    { id: "category", title: "Crear una categoría", done: store.categories.length > 0, href: "/dashboard/categorias" },
    { id: "payment", title: "Configurar un medio de pago", done: store.paymentMethods.length > 0, href: "/dashboard/pagos" },
    { id: "shipping", title: "Configurar un despacho", done: store.shippingMethods.length > 0, href: "/dashboard/envios" },
    { id: "publish", title: "Ver tu tienda publicada", done: !!store.theme?.published, href: `/tienda/${store.slug}` },
  ];

  return NextResponse.json({
    store: { id: store.id, name: store.name, slug: store.slug },
    checklist,
    progress: Math.round((checklist.filter(x => x.done).length / checklist.length) * 100),
    subscription: store.subscription ? {
      status: store.subscription.status,
      trialEndAt: store.subscription.trialEndAt,
      plan: store.subscription.plan.name,
    } : null,
  });
}

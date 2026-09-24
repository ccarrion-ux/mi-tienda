import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      stores: {
        include: {
          products: { where: { active: true }, take: 100 },
          orders: { orderBy: { createdAt: "desc" }, take: 50 },
        },
      },
    },
  });
  const activeStoreId = await getActiveStoreId(userId);
  const store = user?.stores.find(s => s.id === activeStoreId);
  if (!store) return NextResponse.json(null);

  const validOrders = store.orders.filter(o => o.status !== "CANCELLED");
  const sales = validOrders.reduce((s, o) => s + Number(o.total), 0);
  const lowStock = store.products.filter(p => p.stock <= 5);
  const pending = store.orders.filter(o => o.status === "PENDING");

  const priorities: any[] = [];
  if (pending.length) priorities.push({
    icon: "📦", title: `${pending.length} pedido${pending.length > 1 ? "s" : ""} pendiente${pending.length > 1 ? "s" : ""}`,
    text: "Hay pedidos que requieren revisión o procesamiento.",
    href: "/dashboard/pedidos", cta: "Revisar pedidos"
  });
  if (lowStock.length) priorities.push({
    icon: "⚠️", title: "Revisa tu inventario",
    text: `${lowStock.length} producto${lowStock.length > 1 ? "s tienen" : " tiene"} stock bajo.`,
    href: "/dashboard/inventario", cta: "Ver inventario"
  });
  priorities.push({
    icon: "🤖", title: "Consulta a tu asistente",
    text: "Pídele a la IA que prepare una acción para tu negocio y revísala antes de aplicarla.",
    href: "/dashboard/asistente", cta: "Abrir asistente"
  });
  priorities.push({
    icon: "📈", title: "Mira tus números",
    text: "Revisa ventas, productos y comportamiento reciente desde Analítica.",
    href: "/dashboard/analitica", cta: "Ver analítica"
  });

  let summary = "Tu tienda está lista para seguir creciendo.";
  if (pending.length) summary = "Tienes pedidos que merecen tu atención primero.";
  else if (lowStock.length) summary = "Hay inventario que conviene revisar hoy.";

  return NextResponse.json({
    storeName: store.name,
    greeting: user.name?.split(" ")[0] || "Hola",
    metrics: { sales, orders: validOrders.length, products: store.products.length, lowStock: lowStock.length },
    summary,
    priorities: priorities.slice(0, 4),
  });
}

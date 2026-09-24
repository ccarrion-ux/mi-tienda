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
          orders: { orderBy: { createdAt: "desc" }, take: 100 },
          customers: { take: 100 },
        },
      },
    },
  });

  const activeStoreId = await getActiveStoreId(userId);
  const store = user?.stores.find(s => s.id === activeStoreId);
  if (!store) return NextResponse.json({ insights: [] });

  const insights: any[] = [];
  const lowStock = store.products.filter(p => p.stock <= 5);
  const noSku = store.products.filter(p => !p.sku);
  const recentOrders = store.orders.filter(o => o.status !== "CANCELLED").slice(0, 30);

  if (lowStock.length) {
    insights.push({
      type: "attention",
      title: `${lowStock.length} producto${lowStock.length > 1 ? "s" : ""} con stock bajo`,
      description: `Revisa ${lowStock.slice(0, 3).map(p => p.name).join(", ")}${lowStock.length > 3 ? " y otros." : "."}`,
      href: "/dashboard/inventario",
      label: "Revisar inventario",
    });
  }

  if (noSku.length) {
    insights.push({
      type: "action",
      title: "Completa tu catálogo",
      description: `${noSku.length} producto${noSku.length > 1 ? "s no tienen" : " no tiene"} SKU. Completar esta información facilita el control del inventario.`,
      href: "/dashboard/productos",
      label: "Ver productos",
    });
  }

  if (recentOrders.length === 0) {
    insights.push({
      type: "opportunity",
      title: "Activa tu primera venta",
      description: "Configura pagos, despachos y publica tu tienda para dejar el catálogo listo para recibir pedidos.",
      href: "/onboarding",
      label: "Completar tienda",
    });
  } else {
    const total = recentOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const avg = total / recentOrders.length;
    insights.push({
      type: "opportunity",
      title: "Trabaja el ticket promedio",
      description: `Tu promedio aproximado en los últimos ${recentOrders.length} pedidos considerados es $${Math.round(avg).toLocaleString("es-CL")}. Usa ventas cruzadas para explorar oportunidades.`,
      href: "/dashboard/marketing",
      label: "Abrir Marketing IA",
    });
  }

  insights.push({
    type: "action",
    title: "Pide una recomendación a la IA",
    description: "Usa tus datos de catálogo y pedidos para preparar una próxima acción y revisarla antes de aplicarla.",
    href: "/dashboard/asistente",
    label: "Abrir asistente",
  });

  return NextResponse.json({ insights: insights.slice(0, 6) });
}

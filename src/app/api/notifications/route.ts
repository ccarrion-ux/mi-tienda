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
          orders: { orderBy: { createdAt: "desc" }, take: 30 },
        },
      },
    },
  });

  const activeStoreId = await getActiveStoreId(userId);
  const store = user?.stores.find(s => s.id === activeStoreId);
  if (!store) return NextResponse.json({ notifications: [] });

  const notifications: any[] = [];
  const lowStock = store.products.filter(p => p.stock <= 5);
  const pending = store.orders.filter(o => o.status === "PENDING");
  const paid = store.orders.filter(o => o.status === "PAID");

  if (pending.length) {
    notifications.push({
      id: "pending-orders",
      type: "warning",
      title: `${pending.length} pedido${pending.length > 1 ? "s" : ""} pendiente${pending.length > 1 ? "s" : ""}`,
      text: "Hay pedidos que todavía requieren revisión.",
      href: "/dashboard/pedidos",
    });
  }

  if (lowStock.length) {
    notifications.push({
      id: "low-stock",
      type: "warning",
      title: "Stock bajo",
      text: `${lowStock.length} producto${lowStock.length > 1 ? "s tienen" : " tiene"} 5 unidades o menos.`,
      href: "/dashboard/inventario",
    });
  }

  if (paid.length) {
    notifications.push({
      id: "paid-orders",
      type: "success",
      title: "Ventas confirmadas",
      text: `${paid.length} pedido${paid.length > 1 ? "s" : ""} aparece${paid.length > 1 ? "n" : ""} como pagado${paid.length > 1 ? "s" : ""} en los pedidos recientes.`,
      href: "/dashboard/pedidos",
    });
  }

  notifications.push({
    id: "ai",
    type: "info",
    title: "Tu asistente IA está disponible",
    text: "Puedes pedirle que prepare una acción y revisarla antes de aplicarla.",
    href: "/dashboard/asistente",
  });

  return NextResponse.json({ notifications: notifications.slice(0, 10) });
}

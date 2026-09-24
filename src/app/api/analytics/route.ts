import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const activeStoreId = await getActiveStoreId(user.id);

    const { searchParams } = new URL(req.url);
    const requestedDays = Number(searchParams.get("days") || "30");
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;

    const store = await prisma.store.findFirst({
      where: { id: activeStoreId },
      select: { id: true, name: true, slug: true },
    });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const now = new Date();
    const from = startOfDay(new Date(now.getTime() - (days - 1) * DAY));
    const previousFrom = new Date(from.getTime() - days * DAY);

    const orders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        createdAt: { gte: previousFrom },
        status: { not: "CANCELLED" },
      },
      include: {
        items: { include: { product: { include: { category: true } } } },
        customer: true,
        payment: true,
        shippingMethod: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const currentOrders = orders.filter(o => o.createdAt >= from);
    const previousOrders = orders.filter(o => o.createdAt >= previousFrom && o.createdAt < from);

    const revenue = (list: typeof orders) => list.reduce((s, o) => s + Number(o.total || 0), 0);
    const currentRevenue = revenue(currentOrders);
    const previousRevenue = revenue(previousOrders);

    const items = currentOrders.flatMap(o => o.items);
    const unitsSold = items.reduce((s, i) => s + i.quantity, 0);
    const avgOrder = currentOrders.length ? currentRevenue / currentOrders.length : 0;

    const customerOrders = new Map<string, number>();
    for (const o of currentOrders) {
      const key = o.customerId || o.customer?.email || `order:${o.id}`;
      customerOrders.set(key, (customerOrders.get(key) || 0) + 1);
    }
    const newCustomers = [...customerOrders.values()].filter(v => v === 1).length;
    const repeatCustomers = [...customerOrders.values()].filter(v => v > 1).length;

    const byDay = Array.from({ length: days }, (_, idx) => {
      const date = new Date(from.getTime() + idx * DAY);
      const key = date.toISOString().slice(0, 10);
      const dayOrders = currentOrders.filter(o => o.createdAt.toISOString().slice(0, 10) === key);
      return {
        date: key,
        label: date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" }),
        orders: dayOrders.length,
        sales: Number(revenue(dayOrders).toFixed(2)),
      };
    });

    const productMap = new Map<string, { name: string; units: number; revenue: number }>();
    for (const i of items) {
      const key = i.productId;
      const row = productMap.get(key) || { name: i.product.name, units: 0, revenue: 0 };
      row.units += i.quantity;
      row.revenue += Number(i.unitPrice) * i.quantity;
      productMap.set(key, row);
    }
    const topProducts = [...productMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(x => ({ ...x, revenue: Number(x.revenue.toFixed(2)) }));

    const categoryMap = new Map<string, number>();
    for (const i of items) {
      const name = i.product.category?.name || "Sin categoría";
      categoryMap.set(name, (categoryMap.get(name) || 0) + Number(i.unitPrice) * i.quantity);
    }

    const paymentMap = new Map<string, { revenue: number; orders: number }>();
    for (const o of currentOrders) {
      const provider = o.payment?.provider || "Sin pago registrado";
      const row = paymentMap.get(provider) || { revenue: 0, orders: 0 };
      row.revenue += Number(o.total);
      row.orders += 1;
      paymentMap.set(provider, row);
    }

    const shippingMap = new Map<string, { revenue: number; orders: number }>();
    for (const o of currentOrders) {
      const name = o.shippingMethod?.name || "Sin despacho";
      const row = shippingMap.get(name) || { revenue: 0, orders: 0 };
      row.revenue += Number(o.total);
      row.orders += 1;
      shippingMap.set(name, row);
    }

    const statusMap = new Map<string, number>();
    for (const o of currentOrders) statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);

    const lowStock = await prisma.product.findMany({
      where: { storeId: store.id, active: true, stock: { lte: 5 } },
      select: { id: true, name: true, stock: true, sku: true },
      orderBy: { stock: "asc" },
      take: 10,
    });

    return NextResponse.json({
      store,
      period: { days, from, to: now },
      metrics: {
        revenue: Number(currentRevenue.toFixed(2)),
        previousRevenue: Number(previousRevenue.toFixed(2)),
        orders: currentOrders.length,
        previousOrders: previousOrders.length,
        averageOrder: Number(avgOrder.toFixed(2)),
        unitsSold,
        newCustomers,
        repeatCustomers,
        revenueChangePct: previousRevenue ? Number((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)) : null,
        ordersChangePct: previousOrders.length ? Number((((currentOrders.length - previousOrders.length) / previousOrders.length) * 100).toFixed(1)) : null,
      },
      salesByDay: byDay,
      topProducts,
      categories: [...categoryMap.entries()].map(([name, revenue]) => ({ name, revenue: Number(revenue.toFixed(2)) })).sort((a,b) => b.revenue-a.revenue),
      payments: [...paymentMap.entries()].map(([provider, x]) => ({ provider, ...x, revenue: Number(x.revenue.toFixed(2)) })),
      shipping: [...shippingMap.entries()].map(([name, x]) => ({ name, ...x, revenue: Number(x.revenue.toFixed(2)) })),
      statuses: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
      lowStock,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No fue posible generar la analítica" }, { status: 500 });
  }
}

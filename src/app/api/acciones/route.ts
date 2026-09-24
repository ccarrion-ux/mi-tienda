import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";
import { prisma } from "@/lib/prisma";

type LocalAction = { id: string; icon: string; title: string; text: string; href: string; priority: "Alta"|"Media"; status: "Pendiente"|"Completada" };

const memory = new Map<string, Set<string>>();

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { stores: { include: {
    products: { where: { active: true }, take: 100 },
    orders: { orderBy: { createdAt: "desc" }, take: 50 }
  }}}});
  const activeStoreId = await getActiveStoreId(userId);
  const store = user?.stores.find(s => s.id === activeStoreId);
  if (!store) return NextResponse.json({ actions: [] });

  const completed = memory.get(store.id) || new Set<string>();
  const pendingOrders = store.orders.filter(o => o.status === "PENDING");
  const lowStock = store.products.filter(p => p.stock <= 5);
  const missingSku = store.products.filter(p => !p.sku);
  const actions: LocalAction[] = [];

  if (pendingOrders.length) actions.push({ id:"orders", icon:"📦", title:`Revisar ${pendingOrders.length} pedido${pendingOrders.length > 1 ? "s" : ""}`, text:"Hay pedidos pendientes que pueden avanzar al siguiente estado.", href:"/dashboard/pedidos", priority:"Alta", status: completed.has("orders") ? "Completada" : "Pendiente" });
  if (lowStock.length) actions.push({ id:"stock", icon:"⚠️", title:"Reponer inventario", text:`${lowStock.length} producto${lowStock.length > 1 ? "s tienen" : " tiene"} stock bajo.`, href:"/dashboard/inventario", priority:"Alta", status: completed.has("stock") ? "Completada" : "Pendiente" });
  if (missingSku.length) actions.push({ id:"sku", icon:"🏷️", title:"Completar SKUs", text:`Hay ${missingSku.length} producto${missingSku.length > 1 ? "s sin" : " sin"} SKU.`, href:"/dashboard/productos", priority:"Media", status: completed.has("sku") ? "Completada" : "Pendiente" });
  actions.push({ id:"analytics", icon:"📈", title:"Revisar rendimiento", text:"Consulta ventas y comportamiento reciente para decidir tu siguiente movimiento.", href:"/dashboard/analitica", priority:"Media", status: completed.has("analytics") ? "Completada" : "Pendiente" });
  actions.push({ id:"ai", icon:"🤖", title:"Pedir una idea a la IA", text:"Obtén una propuesta basada en los datos actuales de tu tienda.", href:"/dashboard/asistente", priority:"Media", status: completed.has("ai") ? "Completada" : "Pendiente" });

  return NextResponse.json({ actions });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const body = await req.json();
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { stores: true }});
  const storeId = await getActiveStoreId(userId);
  if (!storeId || !body.id) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const completed = memory.get(storeId) || new Set<string>();
  completed.add(body.id);
  memory.set(storeId, completed);
  return NextResponse.json({ ok: true });
}

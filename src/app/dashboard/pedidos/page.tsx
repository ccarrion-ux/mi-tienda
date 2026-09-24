import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import OrderStatus from "./status";
import { getUserStoreContext } from "@/lib/store-context";

export default async function PedidosPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { store: activeStore } = await getUserStoreContext(userId);
  const store = activeStore ? await prisma.store.findUnique({
    where: { id: activeStore.id },
    include: { orders: { include: { customer: true, items: true }, orderBy: { createdAt: "desc" } } }
  });
  if (!store) redirect("/dashboard");

  return (
    <main>
      <header style={{ background: "#111827", color: "white", padding: "18px 0" }}>
        <div className="container"><Link href="/dashboard"><strong>MI TIENDA</strong></Link></div>
      </header>
      <section className="container" style={{ padding: "40px 0" }}>
        <Link href="/dashboard" style={{ textDecoration: "underline" }}>← Dashboard</Link>
        <h1 style={{ marginTop: 20 }}>Pedidos</h1>
        <p style={{ color: "#6b7280" }}>Administra las compras realizadas en tu tienda.</p>

        <div className="card" style={{ marginTop: 24, padding: 0, overflow: "hidden" }}>
          {store.orders.length === 0 ? <div style={{ padding: 30 }}>Todavía no hay pedidos.</div> :
            store.orders.map(o => (
              <div key={o.id} style={{ padding: 20, borderBottom: "1px solid #eee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
                  <div>
                    <strong>Pedido #{o.number}</strong>
                    <div style={{ color: "#6b7280" }}>{o.customer?.name || "Cliente"} · {o.customer?.email || ""}</div>
                  </div>
                  <strong>${Number(o.total).toLocaleString("es-CL")}</strong>
                  <OrderStatus orderId={o.id} current={o.status} />
                </div>
                <div style={{ marginTop: 12, color: "#4b5563", fontSize: 14 }}>
                  {o.items.length} producto(s) · {new Date(o.createdAt).toLocaleString("es-CL")}
                </div>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}

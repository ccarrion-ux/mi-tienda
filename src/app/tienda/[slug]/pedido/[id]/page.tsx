import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function OrderConfirmation({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, store: { slug } },
    include: { items: { include: { product: true } }, customer: true, store: true, shippingMethod: true, payment: true }
  });
  if (!order) notFound();

  return (
    <main className="container" style={{ padding: "70px 0", maxWidth: 760 }}>
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 50 }}>✓</div>
        <h1>¡Pedido recibido!</h1>
        <p>Gracias por comprar en <strong>{order.store.name}</strong>.</p>
        <p>Número de pedido: <strong>#{order.number}</strong></p>
        <p>
          Estado del pago: <strong>{order.payment?.status === "PAID" ? "Pagado" : "Pendiente"}</strong>
        </p>

        <div style={{ textAlign: "left", marginTop: 30 }}>
          {order.items.map(item => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: 12, borderBottom: "1px solid #eee" }}>
              <span>{item.product?.name || "Producto"} × {item.quantity}</span>
              <strong>${(Number(item.unitPrice) * item.quantity).toLocaleString("es-CL")}</strong>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <span>Subtotal</span><strong>${Number(order.subtotal).toLocaleString("es-CL")}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span>Despacho{order.shippingMethod ? ` · ${order.shippingMethod.name}` : ""}</span>
            <strong>${Number(order.shippingCost).toLocaleString("es-CL")}</strong>
          </div>
          <div style={{ textAlign: "right", fontSize: 22, marginTop: 20 }}>
            <strong>Total: ${Number(order.total).toLocaleString("es-CL")}</strong>
          </div>
        </div>

        {order.payment?.provider === "TRANSFER" && (
          <div style={{ marginTop: 24, padding: 16, background: "#f8fafc", borderRadius: 10, textAlign: "left" }}>
            <strong>Transferencia bancaria</strong>
            <p style={{ marginBottom: 0, color: "#475569" }}>
              La tienda debe indicar sus datos bancarios al cliente. En la siguiente etapa agregaremos la configuración de cuenta bancaria y la conciliación del pago.
            </p>
          </div>
        )}

        <Link className="button" href={`/tienda/${slug}`} style={{ marginTop: 24 }}>Volver a la tienda</Link>
      </div>
    </main>
  );
}

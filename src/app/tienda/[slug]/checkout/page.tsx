"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Item = {
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  price: number;
  quantity: number;
  storeSlug: string;
};

type PaymentMethod = {
  provider: string;
  displayName: string;
};

type ShippingMethod = {
  id: string;
  name: string;
  description: string | null;
  price: number;
};

export default function Checkout({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(async p => {
      setSlug(p.slug);
      const all: Item[] = JSON.parse(localStorage.getItem("mi_tienda_cart") || "[]");
      setItems(all.filter(x => x.storeSlug === p.slug));

      const res = await fetch(`/api/store/${p.slug}/shipping-methods`);
      const data = await res.json();
      if (res.ok) {
        setShippingMethods(data.shippingMethods);
        if (data.shippingMethods[0]) setShippingMethodId(data.shippingMethods[0].id);
      }

      const paymentRes = await fetch(`/api/store/${p.slug}/payment-methods`);
      const paymentData = await paymentRes.json();
      if (paymentRes.ok) {
        setPaymentMethods(paymentData.paymentMethods);
        if (paymentData.paymentMethods[0]) setPaymentMethod(paymentData.paymentMethods[0].provider);
      }
    });
  }, [params]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = shippingMethods.find(m => m.id === shippingMethodId)?.price || 0;
  const total = subtotal + shipping;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const customer = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/store/${slug}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer, items, shippingMethodId: shippingMethodId || null, paymentMethod })
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "No fue posible crear el pedido.");
      return;
    }

    if (paymentMethod === "WEBPAY") {
      const paymentRes = await fetch(`/api/store/${slug}/payments/webpay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.order.id })
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok || !paymentData.url || !paymentData.token) {
        setLoading(false);
        setError(paymentData.error || "No fue posible iniciar Webpay.");
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentData.url;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "token_ws";
      input.value = paymentData.token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      return;
    }

    if (paymentMethod === "FLOW") {
      const paymentRes = await fetch(`/api/store/${slug}/payments/flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.order.id })
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok || !paymentData.checkoutUrl) {
        setLoading(false);
        setError(paymentData.error || "No fue posible iniciar Flow.");
        return;
      }
      window.location.href = paymentData.checkoutUrl;
      return;
    }

    if (paymentMethod === "MERCADOPAGO") {
      const paymentRes = await fetch(`/api/store/${slug}/payments/mercadopago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.order.id })
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok || !paymentData.checkoutUrl) {
        setLoading(false);
        setError(paymentData.error || "No fue posible iniciar Mercado Pago.");
        return;
      }
      window.location.href = paymentData.checkoutUrl;
      return;
    }

    const all: Item[] = JSON.parse(localStorage.getItem("mi_tienda_cart") || "[]");
    localStorage.setItem("mi_tienda_cart", JSON.stringify(all.filter(x => x.storeSlug !== slug)));
    setLoading(false);
    router.push(`/tienda/${slug}/pedido/${data.order.id}`);
  }

  if (!items.length) {
    return (
      <main className="container" style={{ padding: "60px 0", maxWidth: 700 }}>
        <h1>Checkout</h1>
        <div className="card">Tu carrito está vacío.</div>
        <Link href={`/tienda/${slug}`} style={{ display: "inline-block", marginTop: 18, textDecoration: "underline" }}>Volver a la tienda</Link>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "40px 0", maxWidth: 950 }}>
      <Link href={`/tienda/${slug}/carrito`} style={{ textDecoration: "underline" }}>← Volver al carrito</Link>
      <h1>Finalizar compra</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        <form className="card" onSubmit={submit}>
          <h2>Datos de contacto</h2>
          <label className="label">Nombre completo</label>
          <input className="input" name="name" required />
          <label className="label">Correo electrónico</label>
          <input className="input" name="email" type="email" required />
          <label className="label">Teléfono</label>
          <input className="input" name="phone" />
          <label className="label">Dirección</label>
          <input className="input" name="address" required />
          <label className="label">Comuna</label>
          <input className="input" name="commune" required />
          <label className="label">Región</label>
          <input className="input" name="region" required />

          <h2 style={{ marginTop: 28 }}>Despacho</h2>
          {!shippingMethods.length && <p style={{ color: "#6b7280" }}>Esta tienda aún no tiene métodos de despacho configurados.</p>}
          {shippingMethods.map(method => (
            <label key={method.id} style={{ display: "flex", gap: 10, padding: 12, border: "1px solid #ddd", borderRadius: 10, marginTop: 8, cursor: "pointer" }}>
              <input type="radio" name="shippingMethod" checked={shippingMethodId === method.id} onChange={() => setShippingMethodId(method.id)} />
              <span style={{ flex: 1 }}>
                <strong>{method.name}</strong>
                <span style={{ display: "block", color: "#6b7280", fontSize: 13 }}>{method.description}</span>
              </span>
              <strong>${method.price.toLocaleString("es-CL")}</strong>
            </label>
          ))}

          <h2 style={{ marginTop: 28 }}>Medio de pago</h2>
          {!paymentMethods.length && (
            <p style={{ color: "#6b7280" }}>Esta tienda aún no tiene medios de pago habilitados.</p>
          )}
          {paymentMethods.map(method => (
            <label key={method.provider} style={{ display: "block", marginTop: 10 }}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === method.provider}
                onChange={() => setPaymentMethod(method.provider)}
              />{" "}
              {method.displayName}
            </label>
          ))}

          {error && <div className="error">{error}</div>}
          <button className="button" style={{ width: "100%", marginTop: 24 }} disabled={loading}>
            {loading ? "Procesando..." : paymentMethod === "FLOW" ? "Pagar con Flow" : paymentMethod === "WEBPAY" ? "Pagar con Webpay" : paymentMethod === "MERCADOPAGO" ? "Ir a Mercado Pago" : "Confirmar pedido"}
          </button>
        </form>

        <aside className="card" style={{ height: "fit-content" }}>
          <h2>Resumen</h2>
          {items.map((i, n) => (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee", gap: 12 }}>
              <span>{i.name}{i.variantName ? ` — ${i.variantName}` : ""} × {i.quantity}</span>
              <strong>${(i.price * i.quantity).toLocaleString("es-CL")}</strong>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <span>Subtotal</span><strong>${subtotal.toLocaleString("es-CL")}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span>Despacho</span><strong>${shipping.toLocaleString("es-CL")}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontSize: 21 }}>
            <strong>Total</strong><strong>${total.toLocaleString("es-CL")}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

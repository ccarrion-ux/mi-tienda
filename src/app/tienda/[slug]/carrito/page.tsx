 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CartItem = { productId: string; variantId: string | null; name: string; variantName: string | null; price: number; quantity: number; imageUrl: string | null; storeSlug: string };

export default function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug);
      const all: CartItem[] = JSON.parse(localStorage.getItem("mi_tienda_cart") || "[]");
      setItems(all.filter(x => x.storeSlug === p.slug));
    });
  }, [params]);

  function update(index: number, quantity: number) {
    const all: CartItem[] = JSON.parse(localStorage.getItem("mi_tienda_cart") || "[]");
    const target = items[index];
    const realIndex = all.findIndex(x => x.productId === target.productId && x.variantId === target.variantId && x.storeSlug === target.storeSlug);
    if (realIndex >= 0) {
      if (quantity <= 0) all.splice(realIndex, 1);
      else all[realIndex].quantity = quantity;
      localStorage.setItem("mi_tienda_cart", JSON.stringify(all));
      setItems(all.filter(x => x.storeSlug === slug));
    }
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <main className="container" style={{ padding: "40px 0", maxWidth: 900 }}>
      <Link href={`/tienda/${slug}`} style={{ textDecoration: "underline" }}>← Seguir comprando</Link>
      <h1>Tu carrito</h1>
      {items.length === 0 ? (
        <div className="card"><p>Tu carrito está vacío.</p></div>
      ) : (
        <>
          <div className="card">
            {items.map((item, index) => (
              <div key={`${item.productId}-${item.variantId}`} style={{ display: "grid", gridTemplateColumns: "70px 1fr auto auto", gap: 16, alignItems: "center", padding: "16px 0", borderBottom: "1px solid #eee" }}>
                {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: 70, height: 70, background: "#eef0f3", borderRadius: 8 }} />}
                <div><strong>{item.name}</strong>{item.variantName && <div style={{ color: "#6b7280", fontSize: 13 }}>{item.variantName}</div>}</div>
                <input className="input" style={{ width: 80, margin: 0 }} type="number" min="0" value={item.quantity} onChange={e => update(index, Number(e.target.value))} />
                <strong>${(item.price * item.quantity).toLocaleString("es-CL")}</strong>
              </div>
            ))}
            <div style={{ textAlign: "right", paddingTop: 22, fontSize: 22 }}><strong>Total: ${total.toLocaleString("es-CL")}</strong></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <Link className="button" href={`/tienda/${slug}/checkout`}>Continuar al checkout</Link>
          </div>
        </>
      )}
    </main>
  );
}
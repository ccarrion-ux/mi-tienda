 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Variant = { id: string; name: string; price: number | null; stock: number; attributes: unknown };
type Product = { id: string; name: string; price: number; stock: number; imageUrl: string | null; variants: Variant[] };

export default function ProductBuy({ storeSlug, product }: { storeSlug: string; product: Product }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  const variant = product.variants.find(v => v.id === variantId);
  const stock = variant ? variant.stock : product.stock;
  const price = variant?.price ?? product.price;

  function add() {
    if (stock < quantity) { setMessage("No hay suficiente stock."); return; }
    const key = "mi_tienda_cart";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    const item = {
      productId: product.id,
      variantId: variant?.id || null,
      name: product.name,
      variantName: variant?.name || null,
      price,
      quantity,
      imageUrl: product.imageUrl,
      storeSlug
    };
    const index = current.findIndex((x: any) => x.productId === item.productId && x.variantId === item.variantId && x.storeSlug === storeSlug);
    if (index >= 0) current[index].quantity += quantity;
    else current.push(item);
    localStorage.setItem(key, JSON.stringify(current));
    router.push(`/tienda/${storeSlug}/carrito`);
  }

  return (
    <div className="card" style={{ marginTop: 26 }}>
      {product.variants.length > 0 && (
        <>
          <label className="label">Variante</label>
          <select className="input" value={variantId} onChange={e => setVariantId(e.target.value)}>
            {product.variants.map(v => <option key={v.id} value={v.id}>{v.name}{v.price ? ` — $${v.price.toLocaleString("es-CL")}` : ""}</option>)}
          </select>
        </>
      )}
      <div style={{ marginTop: 16, color: stock > 0 ? "#065f46" : "#991b1b" }}>
        {stock > 0 ? `${stock} disponible(s)` : "Sin stock"}
      </div>
      <label className="label">Cantidad</label>
      <input className="input" type="number" min="1" max={Math.max(stock, 1)} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} />
      {message && <div className="error">{message}</div>}
      <button className="button" style={{ width: "100%", marginTop: 18 }} disabled={stock <= 0} onClick={add}>
        Agregar al carrito
      </button>
    </div>
  );
}
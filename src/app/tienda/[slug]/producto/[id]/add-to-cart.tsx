 "use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id:string; name:string; price:number; imageUrl:string|null; stock:number; storeSlug:string;
  variants:{id:string;name:string;price:number|null;stock:number}[];
};

export default function AddToCart({ product }: { product:Product }) {
  const router = useRouter();
  const [variantId,setVariantId]=useState(product.variants[0]?.id||"");
  const [qty,setQty]=useState(1);
  const [message,setMessage]=useState("");

  function add() {
    const variant=product.variants.find(v=>v.id===variantId);
    const available=variant?.stock ?? product.stock;
    if (available < qty) { setMessage("No hay suficiente stock."); return; }
    const key=`mi-tienda-cart-${product.storeSlug}`;
    const current=JSON.parse(localStorage.getItem(key)||"[]");
    const itemId=variantId ? `${product.id}:${variantId}` : product.id;
    const existing=current.find((x:any)=>x.itemId===itemId);
    if(existing) existing.quantity=Math.min(existing.quantity+qty,available);
    else current.push({itemId,productId:product.id,variantId:variantId||null,name:product.name,variantName:variant?.name||null,price:variant?.price ?? product.price,imageUrl:product.imageUrl,quantity:qty,stock:available});
    localStorage.setItem(key,JSON.stringify(current));
    setMessage("Producto agregado al carrito.");
    router.refresh();
  }

  return <div>
    {product.variants.length>0 && <>
      <label className="label">Variante</label>
      <select className="input" value={variantId} onChange={e=>setVariantId(e.target.value)}>
        {product.variants.map(v=><option key={v.id} value={v.id}>{v.name}{v.price!==null?` — $${v.price.toLocaleString("es-CL")}`:""}</option>)}
      </select>
    </>}
    <label className="label">Cantidad</label>
    <input className="input" type="number" min="1" max={product.stock} value={qty} onChange={e=>setQty(Math.max(1,Number(e.target.value)||1))}/>
    {message && <div className="success">{message}</div>}
    <div style={{display:"flex",gap:10,marginTop:18}}>
      <button className="button" onClick={add}>Agregar al carrito</button>
      <button className="button secondary" onClick={()=>router.push(`/tienda/${product.storeSlug}/carrito`)}>Ver carrito</button>
    </div>
  </div>;
}
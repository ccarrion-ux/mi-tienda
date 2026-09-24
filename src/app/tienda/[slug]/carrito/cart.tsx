 "use client";
import Link from "next/link";
import { useEffect,useState } from "react";

type Item={itemId:string;productId:string;variantId:string|null;name:string;variantName:string|null;price:number;imageUrl:string|null;quantity:number;stock:number};

export default function Cart({storeSlug}:{storeSlug:string}) {
  const [items,setItems]=useState<Item[]>([]);
  useEffect(()=>{setItems(JSON.parse(localStorage.getItem(`mi-tienda-cart-${storeSlug}`)||"[]"))},[storeSlug]);
  function save(next:Item[]){setItems(next);localStorage.setItem(`mi-tienda-cart-${storeSlug}`,JSON.stringify(next))}
  const total=items.reduce((s,i)=>s+i.price*i.quantity,0);

  return <main>
    <header style={{background:"#111827",color:"white",padding:"20px 0"}}><div className="container"><Link href={`/tienda/${storeSlug}`}><strong>MI TIENDA</strong></Link></div></header>
    <section className="container" style={{padding:"45px 0",maxWidth:900}}>
      <h1>Tu carrito</h1>
      {items.length===0 ? <div className="card"><p>Tu carrito está vacío.</p><Link className="button" href={`/tienda/${storeSlug}`}>Seguir comprando</Link></div> :
      <>
        <div className="card">
          {items.map(item=><div key={item.itemId} style={{display:"flex",gap:16,alignItems:"center",padding:"16px 0",borderBottom:"1px solid #eee"}}>
            {item.imageUrl?<img src={item.imageUrl} alt="" style={{width:80,height:80,objectFit:"cover",borderRadius:10}}/>:<div style={{width:80,height:80,background:"#eee",borderRadius:10}}/>}
            <div style={{flex:1}}><strong>{item.name}</strong>{item.variantName&&<div style={{color:"#6b7280"}}>{item.variantName}</div>}<div>${item.price.toLocaleString("es-CL")}</div></div>
            <input className="input" style={{width:85}} type="number" min="1" max={item.stock} value={item.quantity} onChange={e=>save(items.map(x=>x.itemId===item.itemId?{...x,quantity:Math.max(1,Math.min(item.stock,Number(e.target.value)||1))}:x))}/>
            <strong>${(item.price*item.quantity).toLocaleString("es-CL")}</strong>
            <button className="button secondary" onClick={()=>save(items.filter(x=>x.itemId!==item.itemId))}>Eliminar</button>
          </div>)}
        </div>
        <div className="card" style={{marginTop:20,textAlign:"right"}}>
          <div style={{fontSize:24,fontWeight:800}}>Total: ${total.toLocaleString("es-CL")}</div>
          <button className="button" style={{marginTop:16}} onClick={()=>alert("Checkout será incorporado en la Fase 5.")}>Continuar al checkout</button>
        </div>
      </>}
    </section>
  </main>;
}
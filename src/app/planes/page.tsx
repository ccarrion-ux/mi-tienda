 "use client";

import { useEffect, useState } from "react";

const fallback = [
  { code:"STARTER", name:"Inicial", price:5990, products:"50 productos", users:"1 usuario", ai:"IA Catálogo", extra:"Ideal para emprender" },
  { code:"GROWTH", name:"Crecimiento", price:19990, products:"500 productos", users:"3 usuarios", ai:"IA Catálogo + Marketing", extra:"Analítica avanzada + dominio" },
  { code:"PRO", name:"Pro", price:28990, products:"Productos ilimitados", users:"10 usuarios", ai:"IA completa", extra:"Todas las herramientas avanzadas" },
];

export default function PlanesPage() {
  const [annual, setAnnual] = useState(false);
  return <main style={{maxWidth:1180,margin:"0 auto",padding:"55px 20px",fontFamily:"Arial,sans-serif",color:"#17202a"}}>
    <header style={{textAlign:"center",marginBottom:38}}>
      <a href="/" style={{color:"#667085"}}>Mi Tienda</a>
      <h1 style={{fontSize:42,margin:"16px 0 8px"}}>Elige el plan para hacer crecer tu tienda</h1>
      <p style={{fontSize:18,color:"#667085"}}>Prueba Mi Tienda gratis durante 30 días.</p>
      <button onClick={()=>setAnnual(!annual)} style={{marginTop:18,border:"1px solid #d0d5dd",background:"#fff",borderRadius:10,padding:"10px 15px",cursor:"pointer"}}>
        {annual ? "Mostrar mensual" : "Mostrar anual"}
      </button>
    </header>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
      {fallback.map((p,i)=><article key={p.code} style={{border:"1px solid #e4e7ec",borderRadius:18,padding:25,boxShadow:i===1?"0 8px 30px rgba(0,0,0,.08)":"none"}}>
        {i===1 && <div style={{fontSize:12,fontWeight:700,marginBottom:10}}>RECOMENDADO PARA CRECER</div>}
        <h2>{p.name}</h2>
        <div style={{fontSize:34,fontWeight:700,margin:"14px 0"}}>{annual ? `$${Math.round(p.price*10).toLocaleString("es-CL")}` : `$${p.price.toLocaleString("es-CL")}`} <small style={{fontSize:14,fontWeight:400}}>/ {annual ? "año" : "mes"}</small></div>
        <p>🎁 30 días gratis</p><hr/>
        <p>✓ {p.products}</p><p>✓ {p.users}</p><p>✓ {p.ai}</p><p>✓ {p.extra}</p>
        <a href="/registro" style={{display:"block",textAlign:"center",marginTop:22,textDecoration:"none",background:"#111827",color:"#fff",padding:12,borderRadius:10}}>Comenzar prueba gratis</a>
      </article>)}
    </div>
    <p style={{textAlign:"center",color:"#667085",marginTop:25}}>Enterprise: solución personalizada para empresas.</p>
  </main>;
}

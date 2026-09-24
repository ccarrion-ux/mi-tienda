 "use client";

import { useEffect, useState } from "react";

export default function Onboarding() {
  const [data,setData]=useState<any>(null);
  const [business,setBusiness]=useState("");
  const [style,setStyle]=useState("moderno y profesional");
  const [ai,setAi]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{fetch("/api/onboarding").then(r=>r.json()).then(setData)},[]);

  async function launch(){
    if(!business.trim()) return;
    setLoading(true);setError("");
    const r=await fetch("/api/ai/launch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({business,style})});
    const j=await r.json();
    if(!r.ok)setError(j.error||"No fue posible generar el plan"); else setAi(j);
    setLoading(false);
  }

  if(!data)return <main className="page">Preparando tu tienda…</main>;
  const days=Math.max(0,Math.ceil((new Date(data.subscription?.trialEndAt).getTime()-Date.now())/86400000));

  return <main className="page">
    <header><div><span className="brand">MI TIENDA</span><h1>Hagamos despegar {data.store.name} 🚀</h1><p>Te acompañamos durante tus primeros 30 días gratis.</p></div><div className="trial">🎁 <b>{days} días</b><span> de prueba restantes</span></div></header>

    <section className="progress"><div className="progressTop"><b>Tu tienda está {data.progress}% lista</b><span>{data.checklist.filter((x:any)=>x.done).length}/{data.checklist.length}</span></div><div className="track"><div style={{width:`${data.progress}%`}} /></div></section>

    <section className="layout">
      <div className="card"><h2>Checklist de lanzamiento</h2>{data.checklist.map((x:any)=><a className={`step ${x.done?"done":""}`} href={x.href} key={x.id}><span>{x.done?"✓":"○"}</span><b>{x.title}</b><small>{x.done?"Listo":"Completar"}</small></a>)}</div>
      <div className="card ai"><div className="tag">✨ ASISTENTE DE LANZAMIENTO CON IA</div><h2>Cuéntame qué vendes</h2><p>La IA puede proponerte categorías, estructura de portada, productos iniciales y un plan para tu primera semana.</p><textarea value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Ej.: vendo snacks saludables, barritas y frutos secos…" /><select value={style} onChange={e=>setStyle(e.target.value)}><option>moderno y profesional</option><option>minimalista</option><option>elegante</option><option>vibrante y juvenil</option></select><button onClick={launch} disabled={loading}>{loading?"Creando propuesta…":"Crear mi plan con IA"}</button>{error&&<div className="error">{error}</div>}</div></section>

    {ai&&<section className="card result"><div className="tag">TU PROPUESTA</div><h2>{ai.positioning}</h2><div className="columns"><div><h3>Categorías</h3><ul>{ai.categories.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div><div><h3>Portada</h3><p><b>{ai.homepage.heroTitle}</b></p><p>{ai.homepage.heroSubtitle}</p><p>CTA: {ai.homepage.cta}</p></div><div><h3>Primera semana</h3><ul>{ai.firstWeek.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div></div><h3>Productos iniciales sugeridos</h3><div className="products">{ai.starterProducts.map((p:any,i:number)=><div className="product" key={i}><b>{p.name}</b><span>{p.shortDescription}</span><small>{p.suggestedCategory}</small></div>)}</div></section>}

    <a className="dashboard" href="/dashboard">Ir al dashboard →</a>
    <style jsx>{`
      .page{max-width:1120px;margin:auto;padding:35px 20px 70px;font-family:Arial,sans-serif;color:#17202a}.brand{font-weight:800;letter-spacing:1px;font-size:13px}.page h1{font-size:38px;margin:10px 0 6px}.page p{color:#667085;line-height:1.5}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.trial{border:1px solid #e4e7ec;border-radius:14px;padding:14px 18px;white-space:nowrap}.progress,.card{border:1px solid #e4e7ec;border-radius:16px;background:#fff;padding:20px}.progress{margin:25px 0}.progressTop{display:flex;justify-content:space-between}.track{height:10px;background:#eef1f4;border-radius:10px;margin-top:12px;overflow:hidden}.track div{height:100%;background:#111827}.layout{display:grid;grid-template-columns:1fr 1fr;gap:16px}.step{display:grid;grid-template-columns:30px 1fr auto;gap:8px;align-items:center;text-decoration:none;color:#17202a;padding:14px 0;border-bottom:1px solid #eef0f2}.step span{font-size:20px}.step small{color:#667085}.step.done{color:#475467}.ai{background:#fafafa}.tag{font-size:11px;font-weight:800;letter-spacing:.8px;color:#667085}.ai textarea{width:100%;min-height:110px;border:1px solid #d0d5dd;border-radius:10px;padding:12px;resize:vertical;box-sizing:border-box;margin:12px 0}.ai select{width:100%;padding:11px;border:1px solid #d0d5dd;border-radius:10px;background:white}.ai button{width:100%;margin-top:12px;padding:12px;border:0;border-radius:10px;background:#111827;color:#fff;font-weight:700;cursor:pointer}.ai button:disabled{opacity:.6}.error{margin-top:12px;color:#b42318;background:#fef3f2;padding:10px;border-radius:8px}.result{margin-top:16px}.columns{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px}.columns li,.result li{margin:7px 0}.products{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.product{border:1px solid #eef0f2;border-radius:10px;padding:13px;display:flex;flex-direction:column;gap:6px}.product span,.product small{color:#667085}.dashboard{display:inline-block;margin-top:22px;color:#111827;font-weight:700}@media(max-width:800px){header,.layout,.columns{display:block}.trial{display:inline-block;margin-top:15px}.card{margin-bottom:15px}.products{grid-template-columns:1fr}}
    `}</style>
  </main>;
}

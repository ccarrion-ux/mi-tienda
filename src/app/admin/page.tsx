 "use client";

import { useEffect, useState } from "react";

const money = (n:number) => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n||0);

function Metric({label,value}:{label:string,value:string}) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

export default function AdminPage() {
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);
    const r=await fetch("/api/admin/overview");
    const j=await r.json();
    if(!r.ok){setError(j.error||"Sin acceso");setLoading(false);return;}
    setData(j);setLoading(false);
  }
  useEffect(()=>{load()},[]);

  async function action(storeId:string, action:"suspend"|"reactivate"){
    const r=await fetch("/api/admin/stores",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({storeId,action})});
    const j=await r.json();
    if(!r.ok){setError(j.error||"No fue posible actualizar");return;}
    load();
  }

  if(loading) return <main className="page">Cargando panel administrador…</main>;
  if(error) return <main className="page"><div className="alert">{error}</div><p>Configura PLATFORM_ADMIN_EMAILS con el correo del administrador de plataforma.</p></main>;

  return <main className="page">
    <header><div><span className="eyebrow">MI TIENDA · ADMIN</span><h1>Panel Administrador</h1><p>Centro de control de la plataforma.</p></div><div className="admin">{data.admin.email}<br/><b>{data.admin.role}</b></div></header>

    <section className="metrics">
      <Metric label="Tiendas totales" value={String(data.metrics.totalStores)}/>
      <Metric label="Tiendas activas" value={String(data.metrics.activeStores)}/>
      <Metric label="En prueba" value={String(data.metrics.trialing)}/>
      <Metric label="Suscriptores activos" value={String(data.metrics.paid)}/>
      <Metric label="MRR estimado" value={money(data.metrics.mrr)}/>
      <Metric label="Ventas 30 días" value={money(data.metrics.sales30)}/>
    </section>

    <section className="grid2">
      <div className="card"><h2>Planes</h2>{data.plans.map((p:any)=><div className="row" key={p.code}><span>{p.name}</span><b>{p.subscriptions}</b><small>{money(p.price)}/mes</small></div>)}</div>
      <div className="card"><h2>Actividad comercial</h2><div className="big">{data.metrics.orders30}</div><p>pedidos en los últimos 30 días</p><div className="big">{money(data.metrics.sales30)}</div><p>ventas de las tiendas en los últimos 30 días</p></div>
    </section>

    <section className="card"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2>Tiendas</h2><a href="/admin/soporte">Soporte</a></div><div className="table"><div className="thead"><span>Tienda</span><span>Plan</span><span>Estado</span><span>Prueba</span><span>Acción</span></div>
      {data.stores.map((s:any)=><div className="tr" key={s.id}><span><b>{s.name}</b><small>{s.owner}</small></span><span>{s.plan}</span><span>{s.subscriptionStatus}</span><span>{s.trialEndAt?new Date(s.trialEndAt).toLocaleDateString("es-CL"):"—"}</span><span><button onClick={()=>action(s.id,s.storeStatus==="SUSPENDED"?"reactivate":"suspend")}>{s.storeStatus==="SUSPENDED"?"Reactivar":"Suspender"}</button></span></div>)}
    </div></section>

    <style jsx>{`
      .page{max-width:1250px;margin:auto;padding:30px 20px 70px;font-family:Arial,sans-serif;color:#17202a}.eyebrow{font-size:12px;letter-spacing:1px;color:#667085}h1{font-size:34px;margin:8px 0}header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}.admin{text-align:right;color:#667085;font-size:13px}.metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:16px}.metric,.card{border:1px solid #e4e7ec;border-radius:14px;background:#fff}.metric{padding:17px}.metric span{display:block;color:#667085;font-size:13px}.metric strong{display:block;font-size:24px;margin-top:8px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.card{padding:20px;margin-bottom:14px}.row{display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:12px 0;border-bottom:1px solid #f0f2f4}.big{font-size:28px;font-weight:700;margin-top:16px}.table{overflow:auto}.thead,.tr{min-width:780px;display:grid;grid-template-columns:1.4fr .8fr .9fr .9fr .8fr;gap:10px;padding:12px 0;border-bottom:1px solid #edf0f2;align-items:center}.thead{font-size:12px;color:#667085;font-weight:700}.tr small{display:block;color:#667085;margin-top:4px}.tr button{border:1px solid #d0d5dd;background:#fff;border-radius:8px;padding:8px 10px;cursor:pointer}.alert{background:#fff1f1;border:1px solid #f0b5b5;border-radius:10px;padding:14px}@media(max-width:900px){.metrics{grid-template-columns:repeat(3,1fr)}.grid2{grid-template-columns:1fr}}@media(max-width:560px){.metrics{grid-template-columns:1fr 1fr}header{display:block}.admin{text-align:left;margin-top:12px}}
    `}</style>
  </main>;
}

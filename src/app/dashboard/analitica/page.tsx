 "use client";

import { useEffect, useMemo, useState } from "react";

type Analytics = any;

const money = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n || 0);

function Card({ title, value, note }: { title: string; value: string; note?: string }) {
  return <div className="card"><div className="muted">{title}</div><div className="metric">{value}</div>{note && <div className="small">{note}</div>}</div>;
}

function BarList({ rows, valueKey = "revenue", labelKey = "name" }: any) {
  const max = Math.max(...rows.map((r: any) => Number(r[valueKey]) || 0), 1);
  return <div className="barList">{rows.map((r: any, i: number) => (
    <div key={i} className="barRow">
      <div className="barHead"><span>{r[labelKey]}</span><b>{money(Number(r[valueKey]))}</b></div>
      <div className="barTrack"><div className="barFill" style={{ width: `${Math.max(3, (Number(r[valueKey]) / max) * 100)}%` }} /></div>
    </div>
  ))}</div>;
}

function LineChart({ data }: { data: any[] }) {
  const width = 760, height = 250, pad = 28;
  const max = Math.max(...data.map(x => x.sales), 1);
  const points = data.map((x, i) => {
    const px = pad + (i * (width - pad * 2)) / Math.max(data.length - 1, 1);
    const py = height - pad - (x.sales / max) * (height - pad * 2);
    return `${px},${py}`;
  }).join(" ");
  return <div className="chartWrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución de ventas">
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" />
    {data.map((x, i) => {
      if (i % Math.max(1, Math.floor(data.length / 6)) !== 0 && i !== data.length - 1) return null;
      const px = pad + (i * (width - pad * 2)) / Math.max(data.length - 1, 1);
      return <text key={i} x={px} y={height - 5} textAnchor="middle" fontSize="10">{x.label}</text>;
    })}
  </svg></div>;
}

export default function AnaliticaPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/analytics?days=${days}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setData(j); setInsights(null);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [days]);

  async function askAI() {
    if (!data) return;
    setAiLoading(true);
    try {
      const r = await fetch("/api/ai/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshot: data }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setInsights(j);
    } catch (e: any) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  const top = useMemo(() => data?.topProducts || [], [data]);

  return <main className="page">
    <div className="topbar">
      <div><a href="/dashboard">← Dashboard</a><h1>Analítica avanzada</h1><p className="muted">Datos de tu tienda para tomar decisiones con información real.</p></div>
      <div className="actions">{[7,30,90].map(d => <button key={d} className={days===d ? "primary" : ""} onClick={() => setDays(d)}>{d} días</button>)}</div>
    </div>

    {error && <div className="alert">{error}</div>}
    {loading ? <div className="card">Cargando analítica…</div> : data && <>
      <section className="grid metrics">
        <Card title="Ventas" value={money(data.metrics.revenue)} note={data.metrics.revenueChangePct == null ? "Sin período anterior" : `${data.metrics.revenueChangePct >= 0 ? "+" : ""}${data.metrics.revenueChangePct}% vs. período anterior`} />
        <Card title="Pedidos" value={String(data.metrics.orders)} note={data.metrics.ordersChangePct == null ? "Sin período anterior" : `${data.metrics.ordersChangePct >= 0 ? "+" : ""}${data.metrics.ordersChangePct}% vs. período anterior`} />
        <Card title="Ticket promedio" value={money(data.metrics.averageOrder)} />
        <Card title="Unidades vendidas" value={String(data.metrics.unitsSold)} />
        <Card title="Clientes nuevos" value={String(data.metrics.newCustomers)} />
        <Card title="Clientes recurrentes" value={String(data.metrics.repeatCustomers)} />
      </section>

      <section className="card">
        <div className="sectionHead"><div><h2>Evolución de ventas</h2><p className="muted">Ventas por día durante los últimos {days} días.</p></div></div>
        <LineChart data={data.salesByDay} />
      </section>

      <section className="two">
        <div className="card"><h2>Productos más vendidos</h2>{top.length ? <BarList rows={top} /> : <p className="muted">Sin ventas en el período.</p>}</div>
        <div className="card"><h2>Ventas por categoría</h2>{data.categories.length ? <BarList rows={data.categories} /> : <p className="muted">Sin datos.</p>}</div>
      </section>

      <section className="two">
        <div className="card"><h2>Medios de pago</h2><div className="table">{data.payments.map((x:any) => <div className="tr" key={x.provider}><span>{x.provider}</span><b>{money(x.revenue)}</b><span>{x.orders} pedidos</span></div>)}</div></div>
        <div className="card"><h2>Despachos</h2><div className="table">{data.shipping.map((x:any) => <div className="tr" key={x.name}><span>{x.name}</span><b>{money(x.revenue)}</b><span>{x.orders} pedidos</span></div>)}</div></div>
      </section>

      <section className="two">
        <div className="card"><h2>Estado de pedidos</h2><div className="statusGrid">{data.statuses.map((x:any)=><div className="status" key={x.status}><b>{x.count}</b><span>{x.status}</span></div>)}</div></div>
        <div className="card"><h2>Stock bajo</h2>{data.lowStock.length ? <div className="table">{data.lowStock.map((x:any)=><div className="tr" key={x.id}><span>{x.name}</span><b>{x.stock} un.</b></div>)}</div> : <p className="muted">No hay productos con 5 unidades o menos.</p>}</div>
      </section>

      <section className="card aiBox">
        <div className="sectionHead"><div><h2>✨ Analítica con IA</h2><p className="muted">Interpreta los datos y propone acciones para los próximos 7 días.</p></div><button className="primary" onClick={askAI} disabled={aiLoading}>{aiLoading ? "Analizando…" : "Analizar con IA"}</button></div>
        {insights && <div className="aiGrid">
          <div><h3>Hallazgos</h3><ul>{insights.findings.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div>
          <div><h3>Oportunidades</h3><ul>{insights.opportunities.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div>
          <div><h3>Riesgos</h3><ul>{insights.risks.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div>
          <div><h3>Próximos 7 días</h3><ul>{insights.next7Days.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div>
        </div>}
      </section>
    </>}
    <style jsx>{`
      .page{max-width:1200px;margin:0 auto;padding:28px 20px 60px;font-family:Arial,sans-serif;color:#17202a}
      .topbar{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:22px}
      h1{font-size:32px;margin:8px 0}.muted{color:#68737d}.small{font-size:12px;color:#68737d;margin-top:5px}
      .actions{display:flex;gap:8px;flex-wrap:wrap}.actions button,.sectionHead button{border:1px solid #d9dee4;background:#fff;border-radius:9px;padding:9px 13px;cursor:pointer}.primary{background:#111827!important;color:white;border-color:#111827!important}
      .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}.card{border:1px solid #e2e6ea;border-radius:14px;padding:18px;background:white;margin-bottom:14px;box-shadow:0 2px 10px rgba(0,0,0,.03)}.metric{font-size:25px;font-weight:700;margin-top:8px}
      .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.sectionHead{display:flex;justify-content:space-between;align-items:center;gap:15px}.chartWrap{height:250px;color:#111827}.chartWrap svg{width:100%;height:100%;overflow:visible}
      .barRow{margin:14px 0}.barHead{display:flex;justify-content:space-between;gap:10px;font-size:13px}.barTrack{height:8px;background:#edf0f2;border-radius:10px;margin-top:6px;overflow:hidden}.barFill{height:100%;background:#111827;border-radius:10px}
      .table{display:flex;flex-direction:column}.tr{display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:11px 0;border-bottom:1px solid #eef0f2;font-size:14px}.statusGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.status{border:1px solid #edf0f2;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:4px}.status b{font-size:22px}
      .aiBox{background:#fafafa}.aiGrid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.aiGrid h3{margin-bottom:5px}.aiGrid li{margin:8px 0;line-height:1.45}.alert{background:#fff0f0;border:1px solid #f0b5b5;padding:12px;border-radius:10px;margin-bottom:14px}
      @media(max-width:900px){.grid{grid-template-columns:repeat(3,1fr)}.two,.aiGrid{grid-template-columns:1fr}.topbar{align-items:flex-start;flex-direction:column}}
      @media(max-width:560px){.grid{grid-template-columns:1fr 1fr}.tr{grid-template-columns:1fr auto}.tr span:last-child{display:none}}
    `}</style>
  </main>;
}

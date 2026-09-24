 "use client";

import { useEffect, useState } from "react";

type Data = {
  storeName: string;
  greeting: string;
  metrics: { sales: number; orders: number; products: number; lowStock: number };
  summary: string;
  priorities: { icon: string; title: string; text: string; href: string; cta: string }[];
};

export default function MiDiaPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mi-dia")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="container mt-page"><div className="card mt-empty"><div className="mt-empty-icon">✨</div><h3>Preparando tu día…</h3></div></main>;
  if (!data) return <main className="container mt-page"><div className="card mt-empty"><h3>No pudimos cargar tu resumen.</h3></div></main>;

  return (
    <main className="container mt-page">
      <div className="mt-page-head">
        <div>
          <div className="mt-eyebrow">Mi Tienda · Resumen diario</div>
          <h1>{data.greeting} 👋</h1>
          <p>Aquí tienes lo más importante de <strong>{data.storeName}</strong> para comenzar.</p>
        </div>
        <a className="button accent" href="/dashboard/asistente">✨ Preguntar a IA</a>
      </div>

      <section className="mt-day-hero">
        <div>
          <span className="mt-launch-kicker">Resumen inteligente</span>
          <h2>{data.summary}</h2>
          <p>Revisa las prioridades y entra directamente en cada área.</p>
        </div>
        <div className="mt-day-spark">✦</div>
      </section>

      <div className="mt-kpi-row mt-day-kpis">
        <div className="mt-kpi"><div className="mt-kpi-label">Ventas recientes</div><div className="mt-kpi-value">${data.metrics.sales.toLocaleString("es-CL")}</div></div>
        <div className="mt-kpi"><div className="mt-kpi-label">Pedidos</div><div className="mt-kpi-value">{data.metrics.orders}</div></div>
        <div className="mt-kpi"><div className="mt-kpi-label">Stock bajo</div><div className="mt-kpi-value">{data.metrics.lowStock}</div></div>
      </div>

      <div className="mt-section-heading">
        <div><h2 className="mt-section-title">Qué merece tu atención</h2><p>Acciones sugeridas a partir de datos actuales.</p></div>
      </div>

      <div className="mt-day-grid">
        {data.priorities.map((p, i) => (
          <article className="card mt-day-card" key={`${p.title}-${i}`}>
            <div className="mt-day-icon">{p.icon}</div>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
            <a className="button secondary" href={p.href}>{p.cta} →</a>
          </article>
        ))}
      </div>
    </main>
  );
}

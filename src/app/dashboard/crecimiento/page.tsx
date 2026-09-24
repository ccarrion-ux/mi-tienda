 "use client";

import { useEffect, useState } from "react";

type Insight = {
  type: "opportunity" | "attention" | "action";
  title: string;
  description: string;
  href: string;
  label: string;
};

export default function GrowthCenter() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/growth")
      .then(r => r.json())
      .then(d => setInsights(d.insights || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container mt-page">
      <div className="mt-page-head">
        <div>
          <div className="mt-eyebrow">Mi Tienda 2.0</div>
          <h1>Centro de crecimiento 🚀</h1>
          <p>Una vista simple de lo que merece tu atención para seguir haciendo crecer tu negocio.</p>
        </div>
        <a className="button accent" href="/dashboard/asistente">✨ Hablar con IA</a>
      </div>

      <div className="mt-growth-hero">
        <div>
          <span className="mt-launch-kicker">Tu próxima oportunidad</span>
          <h2>Convierte los datos de tu tienda en acciones.</h2>
          <p>Mi Tienda reúne señales de catálogo, inventario y ventas para ayudarte a priorizar.</p>
        </div>
        <div className="mt-growth-orb">✦</div>
      </div>

      <div className="mt-section-heading">
        <div>
          <h2 className="mt-section-title">Prioridades de hoy</h2>
          <p>Recomendaciones basadas en datos disponibles de tu tienda.</p>
        </div>
      </div>

      {loading ? (
        <div className="card mt-empty"><div className="mt-empty-icon">⏳</div><h3>Analizando tu tienda…</h3></div>
      ) : insights.length === 0 ? (
        <div className="mt-empty">
          <div className="mt-empty-icon">✨</div>
          <h3>Todo tranquilo por ahora</h3>
          <p>Cuando aparezcan señales relevantes, las encontrarás aquí.</p>
        </div>
      ) : (
        <div className="mt-growth-grid">
          {insights.map((item, i) => (
            <article className="card mt-growth-card" key={`${item.title}-${i}`}>
              <div className={`mt-growth-type ${item.type}`}>{item.type === "opportunity" ? "Oportunidad" : item.type === "attention" ? "Atención" : "Acción"}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <a className="button secondary" href={item.href}>{item.label} →</a>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

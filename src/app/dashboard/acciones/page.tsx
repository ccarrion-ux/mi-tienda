 "use client";

import { useEffect, useState } from "react";

type Action = {
  id: string; icon: string; title: string; text: string; href: string;
  priority: "Alta" | "Media"; status: "Pendiente" | "Completada";
};

export default function AccionesPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => fetch("/api/acciones").then(r => r.json()).then(d => setActions(d.actions || [])).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);

  async function complete(id: string) {
    await fetch("/api/acciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  const pending = actions.filter(a => a.status === "Pendiente");
  const done = actions.filter(a => a.status === "Completada");

  return (
    <main className="container mt-page">
      <div className="mt-page-head">
        <div>
          <div className="mt-eyebrow">Mi Tienda · Centro de acción</div>
          <h1>¿Qué hacemos hoy? ⚡</h1>
          <p>Convierte las señales de tu tienda en acciones concretas.</p>
        </div>
        <a className="button secondary" href="/dashboard/mi-dia">← Volver a Mi Día</a>
      </div>

      <section className="mt-action-hero">
        <div>
          <span className="mt-launch-kicker">Tu siguiente paso</span>
          <h2>{pending.length ? `${pending.length} acción${pending.length > 1 ? "es" : ""} para avanzar hoy.` : "Todo al día por ahora."}</h2>
          <p>Las acciones son sugerencias. Tú decides cuándo ejecutarlas.</p>
        </div>
        <div className="mt-action-count">{pending.length}</div>
      </section>

      {loading ? <div className="card mt-empty"><h3>Cargando acciones…</h3></div> : (
        <>
          <div className="mt-section-heading"><div><h2 className="mt-section-title">Pendientes</h2><p>Ordenadas por atención recomendada.</p></div></div>
          <div className="mt-action-grid">
            {pending.map(a => (
              <article className="card mt-action-card" key={a.id}>
                <div className="mt-action-top"><span className="mt-day-icon">{a.icon}</span><span className={`mt-priority ${a.priority === "Alta" ? "high" : ""}`}>{a.priority}</span></div>
                <h3>{a.title}</h3><p>{a.text}</p>
                <div className="mt-action-buttons">
                  <a className="button accent" href={a.href}>Abrir →</a>
                  <button className="button secondary" onClick={() => complete(a.id)}>Marcar hecha</button>
                </div>
              </article>
            ))}
            {!pending.length && <div className="card mt-empty"><div className="mt-empty-icon">✓</div><h3>No tienes acciones pendientes.</h3><p>Cuando aparezca una señal importante, estará aquí.</p></div>}
          </div>

          {done.length > 0 && <><div className="mt-section-heading"><div><h2 className="mt-section-title">Completadas</h2></div></div>
            <div className="mt-action-grid">
              {done.map(a => <article className="card mt-action-card completed" key={a.id}><div className="mt-action-top"><span className="mt-day-icon">✓</span><span className="mt-priority done">Completada</span></div><h3>{a.title}</h3><p>{a.text}</p></article>)}
            </div>
          </>}
        </>
      )}
    </main>
  );
}

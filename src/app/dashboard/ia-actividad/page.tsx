 "use client";
import { useEffect, useState } from "react";

type Activity = { id:string; actionType:string; status:string; summary:string; details:any; createdAt:string };

export default function IAActividadPage() {
  const [items, setItems] = useState<Activity[]>([]);
  useEffect(() => { fetch("/api/ai/activity").then(r=>r.json()).then(d=>setItems(d.activities || [])); }, []);

  return <main className="container mt-page">
    <div className="mt-page-head">
      <div><div className="mt-eyebrow">Mi Tienda · Transparencia</div><h1>Centro de Actividad IA 🔐</h1><p>Revisa las propuestas y acciones realizadas por la IA en tu tienda.</p></div>
      <a className="button secondary" href="/dashboard/ia-ejecutiva">← IA Ejecutiva</a>
    </div>
    <section className="card mt-control-card"><h3>Tu control siempre primero</h3><p>Las acciones sensibles requieren confirmación explícita. Aquí puedes revisar qué ocurrió y cuándo.</p></section>
    <div className="mt-activity-list">
      {items.map(item => <article className="card mt-activity-item" key={item.id}>
        <div className="mt-activity-icon">🤖</div>
        <div className="mt-activity-main">
          <div className="mt-activity-head"><strong>{item.summary}</strong><span className={`mt-priority ${item.status === "EXECUTED" ? "done" : ""}`}>{item.status === "EXECUTED" ? "Ejecutada" : item.status}</span></div>
          <small>{new Date(item.createdAt).toLocaleString("es-CL")}</small>
          <p>Acción: {item.actionType}</p>
        </div>
      </article>)}
      {!items.length && <div className="card mt-empty"><div className="mt-empty-icon">🤖</div><h3>Aún no hay actividad.</h3><p>Cuando confirmes una acción de IA, aparecerá aquí.</p></div>}
    </div>
  </main>
}

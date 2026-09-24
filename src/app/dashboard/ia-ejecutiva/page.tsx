 "use client";
import { useState } from "react";

export default function IAEjecutiva() {
  const [request, setRequest] = useState("");
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function propose() {
    setLoading(true); setConfirmed(false);
    const r = await fetch("/api/ai/executive", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({request}) });
    const d = await r.json(); setProposal(d.proposal || null); setLoading(false);
  }
  return <main className="container mt-page">
    <div className="mt-page-head"><div><div className="mt-eyebrow">Mi Tienda · IA Ejecutiva</div><h1>Tu IA propone. Tú decides. 🔐</h1><p>Analiza tu tienda y recibe una acción concreta antes de cambiar cualquier cosa.</p></div><a className="button secondary" href="/dashboard/acciones">← Centro de acción</a></div>
    <section className="card mt-ai-executive">
      <label>¿Qué quieres mejorar?</label>
      <textarea value={request} onChange={e=>setRequest(e.target.value)} placeholder="Ej.: dime cuál debería ser mi próxima acción para aumentar las ventas..." />
      <button className="button accent" disabled={loading} onClick={propose}>{loading ? "Analizando…" : "Generar propuesta"}</button>
    </section>
    {proposal && <section className="card mt-ai-proposal">
      <div className="mt-action-top"><span className="mt-priority">Propuesta · requiere confirmación</span><span>🤖</span></div>
      <h2>{proposal.title}</h2><p><b>Por qué:</b> {proposal.reason}</p>
      <p><b>Acción:</b> {proposal.action}</p>
      <div className="mt-ai-preview"><b>Vista previa</b><p>{proposal.preview}</p></div>
      <p><b>Impacto esperado:</b> {proposal.expectedImpact}</p>
      <div className="mt-action-buttons">
        {!confirmed ? <button className="button accent" onClick={()=>setConfirmed(true)}>Confirmar para ejecutar</button> : <span className="mt-priority done">Confirmación registrada · ejecución aún requiere integración de acción</span>}
        <button className="button secondary" onClick={()=>setProposal(null)}>Rechazar</button>
      </div>
    </section>}
    <section className="card mt-control-card"><h3>🔐 Control del usuario</h3><p>Esta fase separa la propuesta de la ejecución. La IA no modifica productos, precios, pedidos ni publicaciones automáticamente.</p></section>
  </main>
}

 "use client";

import { useState } from "react";

const prompts = [
  "Crea un producto llamado Granola Cacao, precio 5990, stock 20.",
  "Prepara una campaña para aumentar el ticket promedio.",
  "Mejora la descripción de mi producto principal.",
];

export default function AsistentePage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function ask(value = message) {
    if (!value.trim()) return;
    setLoading(true); setAnswer(""); setProposal(null);
    try {
      const res = await fetch("/api/ai/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
      });
      const data = await res.json();
      if (!res.ok) setAnswer(data.error || "No fue posible preparar la acción.");
      else setProposal(data.proposal);
    } finally { setLoading(false); }
  }

  async function confirmAction() {
    if (!proposal) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/action/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: proposal.action, payload: proposal.payload }),
      });
      const data = await res.json();
      setAnswer(data.message || data.error || "Acción procesada.");
      setProposal(null);
    } finally { setLoading(false); }
  }

  return (
    <main className="container mt-page">
      <div className="mt-page-head">
        <div>
          <div className="mt-eyebrow">Mi Tienda 2.0 · IA</div>
          <h1>Asistente que prepara acciones 🤖</h1>
          <p>Pídele algo y primero verás una propuesta. Nada se ejecuta sin tu confirmación.</p>
        </div>
      </div>

      <div className="mt-ai-layout">
        <section className="card">
          <div className="mt-ai-orb">✦</div>
          <h2>¿Qué quieres hacer?</h2>
          <p className="mt-muted">Puedes pedir un producto, una mejora de catálogo o un borrador de campaña.</p>

          <div className="mt-ai-prompts">
            {prompts.map((prompt) => (
              <button className="mt-ai-prompt" key={prompt} onClick={() => { setMessage(prompt); ask(prompt); }}>
                {prompt} <span>→</span>
              </button>
            ))}
          </div>

          <textarea className="mt-ai-input" rows={5} value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ej.: Crea un producto llamado..." />
          <div className="mt-actions">
            <button className="button accent" disabled={loading} onClick={() => ask()}>
              {loading ? "Procesando..." : "Preparar propuesta →"}
            </button>
          </div>
        </section>

        <aside className="card mt-ai-side">
          <div className="mt-ai-side-icon">🛡️</div>
          <h3>Tú mantienes el control</h3>
          <p>La IA prepara una propuesta y tú decides si aplicarla.</p>
          <ul>
            <li>Vista previa antes de ejecutar</li>
            <li>Productos creados como borrador</li>
            <li>No publica campañas automáticamente</li>
            <li>Acciones limitadas por tienda</li>
          </ul>
        </aside>
      </div>

      {proposal && (
        <section className="card mt-ai-proposal">
          <div className="mt-eyebrow">Vista previa · requiere confirmación</div>
          <h2>{proposal.title || "Acción propuesta"}</h2>
          <p>{proposal.summary}</p>
          <pre>{JSON.stringify(proposal.payload, null, 2)}</pre>
          <div className="mt-actions">
            <button className="button accent" disabled={loading} onClick={confirmAction}>✓ Confirmar y aplicar</button>
            <button className="button secondary" onClick={() => setProposal(null)}>Cancelar</button>
          </div>
        </section>
      )}

      {answer && <section className="card mt-ai-answer"><div className="mt-eyebrow">Resultado</div><div className="mt-ai-answer-text">{answer}</div></section>}
    </main>
  );
}

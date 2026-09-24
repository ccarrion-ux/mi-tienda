"use client";

import { useState } from "react";

type Campaign = {
  name: string; objective: string; audience: string; offer: string;
  channel: string; message: string; callToAction: string;
};
type Result = {
  summary: string;
  priorities: string[];
  campaigns: Campaign[];
  crossSell: { product: string; recommendation: string; reason: string }[];
  content: { socialPost: string; emailSubject: string; emailBody: string; bannerTitle: string; bannerSubtitle: string };
};

export default function MarketingPage() {
  const [request, setRequest] = useState("Analiza mi tienda y dime qué debería promocionar esta semana.");
  const [result, setResult] = useState<Result | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/ai/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible generar el análisis.");
      setResult(data.result);
      setSnapshot(data.snapshot);
    } catch (e: any) {
      setError(e.message || "No fue posible generar el análisis.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ padding: "28px 0", maxWidth: 1100 }}>
      <a href="/dashboard">← Dashboard</a>
      <h1>IA para Ventas & Marketing</h1>
      <p style={{ color: "#6b7280" }}>
        Convierte el catálogo y los pedidos disponibles en propuestas de marketing. La IA propone; tú decides.
      </p>

      <div className="card" style={{ marginTop: 20 }}>
        <label className="label">¿Qué quieres saber o preparar?</label>
        <textarea className="input" rows={3} value={request} onChange={e => setRequest(e.target.value)} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {[
            "¿Qué debería promocionar esta semana?",
            "Crea una campaña para aumentar el ticket promedio.",
            "Propón ventas cruzadas para mis productos.",
            "Crea contenido para redes y email."
          ].map(q => (
            <button key={q} className="button secondary" onClick={() => setRequest(q)}>{q}</button>
          ))}
        </div>
        <button className="button" style={{ marginTop: 14 }} onClick={generate} disabled={loading}>
          {loading ? "Analizando..." : "✨ Generar plan"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {snapshot && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
          <div className="card"><small>Pedidos analizados</small><h2>{snapshot.metrics.ordersAnalyzed}</h2></div>
          <div className="card"><small>Ventas analizadas</small><h2>${snapshot.metrics.salesAnalyzed.toLocaleString("es-CL")}</h2></div>
          <div className="card"><small>Ticket promedio</small><h2>${snapshot.metrics.averageOrder.toLocaleString("es-CL")}</h2></div>
          <div className="card"><small>Productos activos</small><h2>{snapshot.metrics.activeProducts}</h2></div>
        </div>
      )}

      {result && (
        <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
          <section className="card">
            <h2>Resumen</h2>
            <p>{result.summary}</p>
            <h3>Prioridades</h3>
            <ul>{result.priorities.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </section>

          <section className="card">
            <h2>Campañas propuestas</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
              {result.campaigns.map((c, i) => (
                <article key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                  <h3 style={{ marginTop: 0 }}>{c.name}</h3>
                  <p><strong>Objetivo:</strong> {c.objective}</p>
                  <p><strong>Público:</strong> {c.audience}</p>
                  <p><strong>Oferta:</strong> {c.offer}</p>
                  <p><strong>Canal:</strong> {c.channel}</p>
                  <p>{c.message}</p>
                  <strong>CTA: {c.callToAction}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Ventas cruzadas</h2>
            {result.crossSell.length ? result.crossSell.map((x, i) => (
              <div key={i} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                <strong>{x.product} → {x.recommendation}</strong>
                <div style={{ color: "#6b7280" }}>{x.reason}</div>
              </div>
            )) : <p>No hay suficientes datos para proponer ventas cruzadas.</p>}
          </section>

          <section className="card">
            <h2>Contenido listo para usar</h2>
            <h3>Redes sociales</h3>
            <div style={{ whiteSpace: "pre-wrap", padding: 12, background: "#f9fafb", borderRadius: 10 }}>{result.content.socialPost}</div>
            <h3>Email</h3>
            <p><strong>{result.content.emailSubject}</strong></p>
            <div style={{ whiteSpace: "pre-wrap", padding: 12, background: "#f9fafb", borderRadius: 10 }}>{result.content.emailBody}</div>
            <h3>Banner</h3>
            <p style={{ fontSize: 22, fontWeight: 700 }}>{result.content.bannerTitle}</p>
            <p>{result.content.bannerSubtitle}</p>
          </section>
        </div>
      )}
    </main>
  );
}

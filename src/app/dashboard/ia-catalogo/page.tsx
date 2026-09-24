"use client";

import { useEffect, useState } from "react";

type Product = { id: string; name: string; description: string | null; price: number };
type Result = { id: string; name: string; seoTitle: string; seoDescription: string; suggestedCategory: string };

export default function IACatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then(async r => {
      const data = await r.json();
      if (r.ok) setProducts(data.products || []);
      else setError(data.error || "No fue posible cargar los productos.");
    });
  }, []);

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function generate() {
    if (!selected.length) return;
    setLoading(true); setError("");
    const generated: Result[] = [];
    for (const id of selected.slice(0, 20)) {
      const p = products.find(x => x.id === id);
      if (!p) continue;
      const res = await fetch("/api/ai/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: p.id,
          task: "seo",
          product: { name: p.name, description: p.description || "", price: p.price }
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al generar."); break; }
      generated.push({ id: p.id, name: p.name, ...data.result });
    }
    setResults(generated);
    setLoading(false);
  }

  return (
    <main className="container" style={{ padding: "28px 0" }}>
      <a href="/dashboard">← Dashboard</a>
      <h1>IA para el catálogo</h1>
      <p style={{ color: "#6b7280" }}>Selecciona productos y genera propuestas SEO. Nada se modifica automáticamente.</p>
      {error && <div className="error">{error}</div>}

      <div className="card">
        {products.map(p => (
          <label key={p.id} style={{ display: "flex", gap: 10, padding: 10, borderBottom: "1px solid #eee" }}>
            <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
            <span><strong>{p.name}</strong><br /><small>{p.description || "Sin descripción"}</small></span>
          </label>
        ))}
        <button className="button" style={{ marginTop: 16 }} onClick={generate} disabled={loading || !selected.length}>
          {loading ? "Generando..." : `✨ Generar SEO (${selected.length})`}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
          {results.map(r => (
            <div className="card" key={r.id}>
              <h3 style={{ marginTop: 0 }}>{r.name}</h3>
              <p><strong>SEO title:</strong> {r.seoTitle}</p>
              <p><strong>SEO description:</strong> {r.seoDescription}</p>
              <p><strong>Categoría sugerida:</strong> {r.suggestedCategory}</p>
              <a className="button secondary" href={`/dashboard/productos/${r.id}`}>Revisar producto</a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

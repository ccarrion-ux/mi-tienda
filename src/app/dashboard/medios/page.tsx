"use client";

import { useEffect, useState } from "react";

type Media = { id: string; name: string; url: string; alt?: string | null };

export default function MediosPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/media");
    const data = await res.json();
    if (res.ok) setMedia(data.media);
    else setError(data.error || "No fue posible cargar las imágenes.");
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, alt })
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "No fue posible guardar.");
    setMedia(m => [data.media, ...m]);
    setName(""); setUrl(""); setAlt("");
  }

  async function remove(id: string) {
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) setMedia(m => m.filter(x => x.id !== id));
  }

  return (
    <main className="container" style={{ padding: "28px 0" }}>
      <a href="/dashboard">← Dashboard</a>
      <h1>Biblioteca multimedia</h1>
      <p style={{ color: "#6b7280" }}>Guarda las imágenes que quieres reutilizar en tu tienda.</p>

      {error && <div className="error">{error}</div>}

      <div className="card" style={{ maxWidth: 720, marginBottom: 20 }}>
        <h2>Agregar imagen</h2>
        <form onSubmit={add}>
          <label className="label">Nombre</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Portada verano" />
          <label className="label">URL de imagen</label>
          <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          <label className="label">Texto alternativo</label>
          <input className="input" value={alt} onChange={e => setAlt(e.target.value)} placeholder="Productos saludables" />
          <button className="button" style={{ marginTop: 12 }}>Guardar imagen</button>
        </form>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
        {media.map(item => (
          <div className="card" key={item.id}>
            <img src={item.url} alt={item.alt || item.name} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 10 }} />
            <strong style={{ display: "block", marginTop: 10 }}>{item.name}</strong>
            <button className="button secondary" style={{ marginTop: 10 }} onClick={() => remove(item.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </main>
  );
}

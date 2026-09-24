"use client";

import { useEffect, useState } from "react";

type Method = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
};

export default function EnviosPage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [form, setForm] = useState({ name: "", description: "", price: "0" });
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/shipping-methods");
    const data = await res.json();
    if (res.ok) setMethods(data.shippingMethods);
    else setError(data.error || "No fue posible cargar los despachos.");
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/shipping-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "No fue posible crear el método.");
    setForm({ name: "", description: "", price: "0" });
    load();
  }

  async function toggle(method: Method) {
    await fetch(`/api/shipping-methods/${method.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !method.active })
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este método de despacho?")) return;
    await fetch(`/api/shipping-methods/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="container" style={{ padding: "40px 0", maxWidth: 900 }}>
      <a href="/dashboard">← Dashboard</a>
      <h1>Despachos</h1>
      <p style={{ color: "#6b7280" }}>
        Configura los métodos de entrega que aparecerán en el checkout de tu tienda.
      </p>

      <form className="card" onSubmit={create} style={{ marginTop: 24 }}>
        <h2>Agregar método</h2>
        <label className="label">Nombre</label>
        <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Despacho a domicilio" required />
        <label className="label">Descripción</label>
        <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Entrega entre 2 y 4 días hábiles" />
        <label className="label">Costo</label>
        <input className="input" type="number" min="0" step="1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        {error && <div className="error">{error}</div>}
        <button className="button" style={{ marginTop: 18 }}>Agregar despacho</button>
      </form>

      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        {methods.map(method => (
          <div className="card" key={method.id} style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
            <div>
              <strong>{method.name}</strong>
              <div style={{ color: "#6b7280", marginTop: 4 }}>{method.description || "Sin descripción"}</div>
              <div style={{ marginTop: 8 }}>${method.price.toLocaleString("es-CL")} · {method.active ? "Activo" : "Desactivado"}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="button secondary" onClick={() => toggle(method)}>
                {method.active ? "Desactivar" : "Activar"}
              </button>
              <button className="button secondary" onClick={() => remove(method.id)}>Eliminar</button>
            </div>
          </div>
        ))}
        {!methods.length && <div className="card">Aún no tienes métodos de despacho.</div>}
      </div>
    </main>
  );
}

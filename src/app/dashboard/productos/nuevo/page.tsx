 "use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };

export default function NuevoProducto() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(data => setCategories(data.categories || []));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form))
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "No fue posible crear el producto.");
      return;
    }

    router.push("/dashboard/productos");
  }

  return (
    <main className="container" style={{ padding: "40px 0", maxWidth: 760 }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ border: 0, background: "none", cursor: "pointer" }}>← Volver</button>
      </div>

      <div className="card">
        <h1>Nuevo producto</h1>
        <p style={{ color: "#6b7280" }}>Completa la información del producto.</p>

        <form onSubmit={submit}>
          <label className="label">Nombre del producto</label>
          <input className="input" name="name" required />

          <label className="label">Descripción</label>
          <textarea className="input" name="description" rows={5} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="label">Precio (CLP)</label>
              <input className="input" name="price" type="number" min="0" step="1" required />
            </div>
            <div>
              <label className="label">Stock</label>
              <input className="input" name="stock" type="number" min="0" step="1" required />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="label">SKU</label>
              <input className="input" name="sku" />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="input" name="categoryId" defaultValue="">
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <label className="label">URL de imagen</label>
          <input className="input" name="imageUrl" placeholder="https://..." />

          {error && <div className="error">{error}</div>}

          <button className="button" style={{ marginTop: 24 }} disabled={loading}>
            {loading ? "Guardando..." : "Guardar producto"}
          </button>
        </form>
      </div>
    </main>
  );
}
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import VariantManager from "./variantes";

type Props = {
  product: { id: string; name: string; description: string; price: number; stock: number; sku: string; imageUrl: string; categoryId: string; active: boolean };
  categories: { id: string; name: string }[];
};

type AIResult = {
  title: string;
  description: string;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  suggestedCategory: string;
  keywords: string[];
};

export default function EditProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form))
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Error al actualizar."); return; }
    router.push("/dashboard/productos");
    router.refresh();
  }

  async function remove() {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/productos");
    else setError("No fue posible eliminar el producto.");
  }

  async function generateAI(task = "full") {
    setAiLoading(true);
    setAiMessage("");
    setError("");
    try {
      const res = await fetch("/api/ai/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          task,
          product: {
            name: product.name,
            description: product.description,
            category: categories.find(c => c.id === product.categoryId)?.name || "",
            price: product.price,
            sku: product.sku
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible generar contenido.");
      setAiResult(data.result);
      setAiMessage("La IA preparó una propuesta. Tú decides qué aplicar.");
    } catch (e: any) {
      setAiMessage(e.message || "No fue posible generar contenido.");
    } finally {
      setAiLoading(false);
    }
  }

  function applyDescription() {
    const field = document.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
    if (field && aiResult) {
      field.value = aiResult.description;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      setAiMessage("Descripción aplicada al formulario. Guarda los cambios para confirmar.");
    }
  }

  function applyTitle() {
    const field = document.querySelector<HTMLInputElement>('input[name="name"]');
    if (field && aiResult) {
      field.value = aiResult.title;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      setAiMessage("Título aplicado al formulario. Guarda los cambios para confirmar.");
    }
  }

  return (
    <main className="container" style={{ padding: "40px 0", maxWidth: 900 }}>
      <div className="card">
        <h1>Editar producto</h1>

        <div style={{ padding: 16, margin: "18px 0 24px", borderRadius: 12, background: "#f0f7ff", border: "1px solid #dbeafe" }}>
          <strong>🤖 Asistente de producto</strong>
          <p style={{ color: "#4b5563", marginBottom: 12 }}>
            Mejora el contenido del producto usando la información que ya tienes. La IA propone; tú revisas antes de guardar.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="button" onClick={() => generateAI("full")} disabled={aiLoading}>
              {aiLoading ? "Generando..." : "✨ Mejorar producto"}
            </button>
            <button type="button" className="button secondary" onClick={() => generateAI("seo")} disabled={aiLoading}>SEO</button>
            <button type="button" className="button secondary" onClick={() => generateAI("description")} disabled={aiLoading}>Descripción</button>
          </div>
          {aiMessage && <p style={{ fontSize: 13, marginBottom: 0 }}>{aiMessage}</p>}
        </div>

        {aiResult && (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>Propuesta de IA</h3>
            <p><strong>Título:</strong> {aiResult.title}</p>
            <p><strong>Descripción:</strong><br />{aiResult.description}</p>
            <p><strong>Descripción corta:</strong><br />{aiResult.shortDescription}</p>
            <p><strong>SEO title:</strong> {aiResult.seoTitle}</p>
            <p><strong>SEO description:</strong> {aiResult.seoDescription}</p>
            <p><strong>Categoría sugerida:</strong> {aiResult.suggestedCategory}</p>
            <p><strong>Palabras clave:</strong> {aiResult.keywords.join(", ")}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="button secondary" onClick={applyTitle}>Aplicar título</button>
              <button type="button" className="button secondary" onClick={applyDescription}>Aplicar descripción</button>
            </div>
          </div>
        )}

        <form onSubmit={submit}>
          <label className="label">Nombre</label>
          <input className="input" name="name" defaultValue={product.name} required />

          <label className="label">Descripción</label>
          <textarea className="input" name="description" defaultValue={product.description} rows={7} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label className="label">Precio (CLP)</label><input className="input" name="price" type="number" min="0" defaultValue={product.price} required /></div>
            <div><label className="label">Stock</label><input className="input" name="stock" type="number" min="0" defaultValue={product.stock} required /></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label className="label">SKU</label><input className="input" name="sku" defaultValue={product.sku} /></div>
            <div>
              <label className="label">Categoría</label>
              <select className="input" name="categoryId" defaultValue={product.categoryId}>
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <label className="label">URL de imagen</label>
          <input className="input" name="imageUrl" defaultValue={product.imageUrl} />

          <label className="label">Estado</label>
          <select className="input" name="active" defaultValue={product.active ? "true" : "false"}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>

          {error && <div className="error">{error}</div>}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button className="button">Guardar cambios</button>
            <button type="button" className="button secondary" onClick={remove}>Eliminar</button>
          </div>
        </form>
      </div>
      <VariantManager productId={product.id} />
    </main>
  );
}

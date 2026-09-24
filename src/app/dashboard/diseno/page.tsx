"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultTheme, ThemeConfig } from "@/lib/theme";

type PreviewMode = "desktop" | "tablet" | "mobile";

const presets: Record<string, Partial<ThemeConfig>> = {
  Minimal: {
    primaryColor: "#111827", accentColor: "#f3f4f6", backgroundColor: "#ffffff",
    textColor: "#111827", fontFamily: "Inter",
    hero: { enabled: true, title: "Todo lo que buscas, en un solo lugar", subtitle: "Una tienda simple, clara y moderna.", imageUrl: "", buttonText: "Comprar ahora", buttonUrl: "/tienda" }
  },
  Saludable: {
    primaryColor: "#78a9ad", accentColor: "#e8f5f2", backgroundColor: "#ffffff",
    textColor: "#24343a", fontFamily: "Trebuchet MS",
    hero: { enabled: true, title: "Bienestar que se disfruta", subtitle: "Productos seleccionados para acompañar tu día.", imageUrl: "", buttonText: "Ver productos", buttonUrl: "#productos" }
  },
  Elegante: {
    primaryColor: "#1f2937", accentColor: "#efe7d6", backgroundColor: "#faf9f6",
    textColor: "#262626", fontFamily: "Georgia",
    hero: { enabled: true, title: "Una experiencia especial", subtitle: "Descubre nuestra selección.", imageUrl: "", buttonText: "Descubrir", buttonUrl: "#productos" }
  },
  Vibrante: {
    primaryColor: "#7c3aed", accentColor: "#fef3c7", backgroundColor: "#ffffff",
    textColor: "#1f2937", fontFamily: "Arial",
    hero: { enabled: true, title: "Hazlo diferente", subtitle: "Productos con personalidad.", imageUrl: "", buttonText: "Explorar", buttonUrl: "#productos" }
  }
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default function DisenoPage() {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [storeSlug, setStoreSlug] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveState, setSaveState] = useState("Listo");
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [history, setHistory] = useState<ThemeConfig[]>([]);
  const [future, setFuture] = useState<ThemeConfig[]>([]);
  const initialLoad = useRef(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/theme").then(async r => {
      const data = await r.json();
      if (!r.ok) return setError(data.error || "No fue posible cargar el diseño.");
      setTheme(data.theme);
      setStoreSlug(data.storeSlug || "");
      initialLoad.current = false;
    }).catch(() => setError("No fue posible cargar el diseño."));
  }, []);

  const preview = useMemo(() => theme || defaultTheme("Mi Tienda"), [theme]);

  function updateWithHistory(next: ThemeConfig) {
    if (!theme) return;
    setHistory(h => [...h.slice(-29), clone(theme)]);
    setFuture([]);
    setTheme(clone(next));
    setSaved(false);
    setSaveState("Cambios pendientes");
  }

  function update(partial: Partial<ThemeConfig>) {
    updateWithHistory({ ...preview, ...partial });
  }

  function updateHero(partial: Partial<ThemeConfig["hero"]>) {
    update({ hero: { ...preview.hero, ...partial } });
  }

  function updateSection(id: string, partial: Partial<ThemeConfig["sections"][number]>) {
    update({ sections: preview.sections.map(s => s.id === id ? { ...s, ...partial } : s) });
  }

  function moveSection(index: number, direction: -1 | 1) {
    const next = [...preview.sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ sections: next });
  }

  function dropSection(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...preview.sections];
    const [item] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, item);
    update({ sections: next });
    setDragIndex(null);
  }

  function undo() {
    if (!history.length) return;
    const previous = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setFuture(f => [clone(preview), ...f.slice(0, 29)]);
    setTheme(clone(previous));
    setSaveState("Cambios pendientes");
  }

  function redo() {
    if (!future.length) return;
    const next = future[0];
    setFuture(f => f.slice(1));
    setHistory(h => [...h.slice(-29), clone(preview)]);
    setTheme(clone(next));
    setSaveState("Cambios pendientes");
  }

  async function save(showMessage = true) {
    if (!theme) return;
    setSaveState("Guardando...");
    try {
      const res = await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: preview })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible guardar.");
      setTheme(data.theme);
      setSaved(showMessage);
      setSaveState("Guardado");
    } catch (e: any) {
      setError(e.message || "No fue posible guardar.");
      setSaveState("Error");
    }
  }

  useEffect(() => {
    if (initialLoad.current || !theme) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveState("Guardando en 1 s...");
    autosaveTimer.current = setTimeout(() => save(false), 1000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [theme]);

  async function publish() {
    await save(false);
    const res = await fetch("/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" })
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "No fue posible publicar.");
    setSaved(true);
    setSaveState("Publicado");
  }

  async function unpublish() {
    const res = await fetch("/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unpublish" })
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "No fue posible despublicar.");
    setSaveState("Borrador");
  }

  function applyPreset(name: string) {
    const preset = presets[name];
    update({
      ...preset,
      hero: { ...preview.hero, ...(preset.hero || {}) },
      sections: clone(preview.sections)
    });
  }

  async function generateWithAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiMessage("");
    try {
      const res = await fetch("/api/ai/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, currentTheme: preview })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible generar la propuesta.");
      updateWithHistory(data.theme);
      setAiMessage("✓ Propuesta generada. Revísala y publícala cuando estés conforme.");
    } catch (e: any) {
      setAiMessage(e.message || "No fue posible generar la propuesta.");
    } finally {
      setAiLoading(false);
    }
  }

  const previewWidth = previewMode === "mobile" ? 390 : previewMode === "tablet" ? 768 : 1100;

  return (
    <main className="container" style={{ padding: "28px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <a href="/dashboard">← Dashboard</a>
          <h1 style={{ marginBottom: 4 }}>Constructor visual 7.1</h1>
          <p style={{ color: "#6b7280", marginTop: 0 }}>Diseña, guarda y publica tu tienda sin tocar código.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {storeSlug && <a className="button secondary" href={`/tienda/${storeSlug}`} target="_blank">Vista de tienda</a>}
          <button className="button secondary" onClick={undo} disabled={!history.length}>↶ Deshacer</button>
          <button className="button secondary" onClick={redo} disabled={!future.length}>↷ Rehacer</button>
          <button className="button secondary" onClick={unpublish}>Poner en borrador</button>
          <button className="button" onClick={publish}>🚀 Publicar</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0", flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "#6b7280" }}>Estado: <strong>{saveState}</strong></span>
        {saved && <span style={{ color: "#166534", fontSize: 14 }}>✓ Cambios guardados</span>}
      </div>
      {error && <div className="error">{error}</div>}

      {!theme ? <div className="card">Cargando editor...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>
          <aside className="card" style={{ position: "sticky", top: 20, maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}>
            <h2>Diseño</h2>

            <div style={{ padding: 14, borderRadius: 12, background: "#f0f7ff", border: "1px solid #dbeafe", marginBottom: 18 }}>
              <strong>🤖 Diseña con IA</strong>
              <p style={{ fontSize: 13, color: "#4b5563" }}>Describe cómo quieres que se vea tu tienda y Mi Tienda preparará una propuesta.</p>
              <textarea className="input" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Ej.: Quiero una tienda elegante de productos saludables, celeste y blanca, estilo premium." />
              <button className="button" style={{ marginTop: 8, width: "100%" }} onClick={generateWithAI} disabled={aiLoading}>
                {aiLoading ? "Generando..." : "✨ Generar propuesta"}
              </button>
              {aiMessage && <p style={{ fontSize: 12, marginBottom: 0 }}>{aiMessage}</p>}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <a className="button secondary" href="/dashboard/medios">🖼 Biblioteca multimedia</a>
            </div>

            <label className="label">Tema rápido</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {Object.keys(presets).map(name => (
                <button key={name} className="button secondary" onClick={() => applyPreset(name)}>{name}</button>
              ))}
            </div>

            <label className="label" style={{ marginTop: 20 }}>Nombre de marca</label>
            <input className="input" value={preview.brandName} onChange={e => update({ brandName: e.target.value })} />
            <label className="label">Logo URL</label>
            <input className="input" value={preview.logoUrl} onChange={e => update({ logoUrl: e.target.value })} placeholder="https://..." />

            <h3 style={{ marginTop: 24 }}>Colores</h3>
            {[
              ["primaryColor", "Color principal"], ["accentColor", "Color acento"],
              ["backgroundColor", "Fondo"], ["textColor", "Texto"]
            ].map(([key, label]) => (
              <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: 8, alignItems: "center", marginTop: 8 }}>
                <span>{label}</span>
                <input type="color" value={(preview as any)[key]} onChange={e => update({ [key]: e.target.value } as any)} />
              </div>
            ))}

            <label className="label" style={{ marginTop: 20 }}>Tipografía</label>
            <select className="input" value={preview.fontFamily} onChange={e => update({ fontFamily: e.target.value as ThemeConfig["fontFamily"] })}>
              <option>Inter</option><option>Arial</option><option>Trebuchet MS</option><option>Georgia</option>
            </select>

            <h3 style={{ marginTop: 24 }}>Portada</h3>
            <label className="label">Título</label>
            <input className="input" value={preview.hero.title} onChange={e => updateHero({ title: e.target.value })} />
            <label className="label">Subtítulo</label>
            <textarea className="input" value={preview.hero.subtitle} onChange={e => updateHero({ subtitle: e.target.value })} />
            <label className="label">Imagen de portada</label>
            <input className="input" value={preview.hero.imageUrl} onChange={e => updateHero({ imageUrl: e.target.value })} placeholder="https://..." />
            <label className="label">Texto del botón</label>
            <input className="input" value={preview.hero.buttonText} onChange={e => updateHero({ buttonText: e.target.value })} />

            <h3 style={{ marginTop: 24 }}>Secciones</h3>
            <p style={{ fontSize: 12, color: "#6b7280" }}>Arrastra una sección para cambiar su orden.</p>
            {preview.sections.map((section, index) => (
              <div key={section.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => dropSection(index)}
                style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 10, marginTop: 8, cursor: "grab", background: section.enabled ? "#fff" : "#f9fafb" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{section.type}</strong><span style={{ fontSize: 12, color: "#9ca3af" }}>⠿</span>
                </div>
                <input className="input" style={{ marginTop: 8 }} value={section.title} onChange={e => updateSection(section.id, { title: e.target.value })} />
                {section.type === "text" && <textarea className="input" style={{ marginTop: 8 }} value={section.text || ""} onChange={e => updateSection(section.id, { text: e.target.value })} />}
                {section.type === "image" && <input className="input" style={{ marginTop: 8 }} value={section.imageUrl || ""} onChange={e => updateSection(section.id, { imageUrl: e.target.value })} placeholder="https://..." />}
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <button className="button secondary" onClick={() => moveSection(index, -1)}>↑</button>
                  <button className="button secondary" onClick={() => moveSection(index, 1)}>↓</button>
                  <button className="button secondary" onClick={() => updateSection(section.id, { enabled: !section.enabled })}>{section.enabled ? "Visible" : "Oculta"}</button>
                </div>
              </div>
            ))}
          </aside>

          <section style={{ background: "#eef2f7", padding: 20, borderRadius: 18, minHeight: 700 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 14 }}>
              {(["desktop", "tablet", "mobile"] as PreviewMode[]).map(mode => (
                <button key={mode} className="button secondary" onClick={() => setPreviewMode(mode)} style={{ fontWeight: previewMode === mode ? 700 : 400 }}>
                  {mode === "desktop" ? "🖥 Desktop" : mode === "tablet" ? "▣ Tablet" : "📱 Móvil"}
                </button>
              ))}
            </div>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ maxWidth: previewWidth, minWidth: previewMode === "mobile" ? 390 : 0, margin: "0 auto", background: preview.backgroundColor, color: preview.textColor, fontFamily: preview.fontFamily, borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,.08)" }}>
                <header style={{ padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #eee" }}>
                  <strong style={{ fontSize: 24 }}>{preview.logoUrl ? <img src={preview.logoUrl} alt={preview.brandName} style={{ maxHeight: 42, maxWidth: 160 }} /> : preview.brandName}</strong>
                  <span style={{ whiteSpace: "nowrap" }}>Productos &nbsp; Categorías &nbsp; 🛒</span>
                </header>

                {preview.hero.enabled && (
                  <div style={{ minHeight: previewMode === "mobile" ? 300 : 330, padding: previewMode === "mobile" ? 30 : 50, display: "flex", alignItems: "center", backgroundImage: preview.hero.imageUrl ? `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),url(${preview.hero.imageUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center", color: preview.hero.imageUrl ? "#fff" : preview.textColor }}>
                    <div>
                      <h1 style={{ fontSize: previewMode === "mobile" ? 32 : 44, margin: 0 }}>{preview.hero.title}</h1>
                      <p style={{ fontSize: 19, maxWidth: 620 }}>{preview.hero.subtitle}</p>
                      <button className="button" style={{ background: preview.primaryColor }}>{preview.hero.buttonText}</button>
                    </div>
                  </div>
                )}

                {preview.sections.filter(s => s.enabled).map(section => (
                  <div key={section.id} id={section.id} style={{ padding: previewMode === "mobile" ? "30px 20px" : "42px 32px" }}>
                    <h2 style={{ fontSize: 28, marginTop: 0 }}>{section.title}</h2>
                    {section.type === "featured-products" && (
                      <div style={{ display: "grid", gridTemplateColumns: previewMode === "mobile" ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14 }}>
                        {[1,2,3,4].map(i => <div key={i} style={{ border: "1px solid #eee", borderRadius: 10, padding: 18 }}>Producto {i}<div style={{ marginTop: 12, fontWeight: 700 }}>$12.990</div></div>)}
                      </div>
                    )}
                    {section.type === "categories" && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{["Categoría 1", "Categoría 2", "Categoría 3"].map(x => <span key={x} style={{ padding: "10px 16px", borderRadius: 999, background: preview.accentColor }}>{x}</span>)}</div>}
                    {section.type === "text" && <p style={{ fontSize: 17, lineHeight: 1.7 }}>{section.text}</p>}
                    {section.type === "image" && section.imageUrl && <img src={section.imageUrl} alt="" style={{ width: "100%", borderRadius: 12 }} />}
                  </div>
                ))}
                <footer style={{ padding: 30, background: preview.primaryColor, color: "#fff" }}>© {new Date().getFullYear()} {preview.brandName}</footer>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

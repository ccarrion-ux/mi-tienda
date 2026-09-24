 "use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  text: string;
  href?: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => setItems(d.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container mt-page">
      <div className="mt-page-head">
        <div>
          <div className="mt-eyebrow">Centro de actividad</div>
          <h1>Notificaciones 🔔</h1>
          <p>Señales importantes de tu tienda, reunidas en un solo lugar.</p>
        </div>
      </div>

      {loading ? (
        <div className="card mt-empty"><div className="mt-empty-icon">⏳</div><h3>Cargando actividad…</h3></div>
      ) : items.length === 0 ? (
        <div className="mt-empty">
          <div className="mt-empty-icon">✨</div>
          <h3>No tienes notificaciones pendientes</h3>
          <p>Cuando ocurra algo que merezca tu atención, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="mt-notifications">
          {items.map(item => (
            <article className={`card mt-notification ${item.type}`} key={item.id}>
              <div className="mt-notification-icon">
                {item.type === "success" ? "✓" : item.type === "warning" ? "!" : "i"}
              </div>
              <div className="mt-notification-copy">
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                {item.href && <a href={item.href}>Ver detalle →</a>}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

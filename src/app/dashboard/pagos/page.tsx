"use client";

import { useEffect, useState } from "react";

const labels: Record<string, { title: string; description: string }> = {
  FLOW: { title: "Flow", description: "Pagos online con Flow." },
  WEBPAY: { title: "Webpay", description: "Tarjetas y medios habilitados por Transbank." },
  MERCADOPAGO: { title: "Mercado Pago", description: "Pagos procesados por Mercado Pago." },
  TRANSFER: { title: "Transferencia bancaria", description: "El cliente paga mediante transferencia y la tienda concilia manualmente." },
  TEST: { title: "Pago de prueba", description: "Solo para desarrollo y pruebas. No usar en producción." }
};

export default function PagosPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/payment-methods");
    const data = await res.json();
    if (res.ok) setMethods(data.paymentMethods);
    else setError(data.error || "No fue posible cargar los medios de pago.");
  }

  useEffect(() => { load(); }, []);

  async function toggle(provider: string, enabled: boolean) {
    const res = await fetch("/api/payment-methods", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, enabled })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "No fue posible actualizar.");
      return;
    }
    load();
  }

  return (
    <main className="container" style={{ padding: "40px 0", maxWidth: 900 }}>
      <a href="/dashboard">← Dashboard</a>
      <h1>Pagos</h1>
      <p style={{ color: "#6b7280" }}>
        Activa los medios que aparecerán en el checkout de tu tienda.
      </p>

      {error && <div className="error">{error}</div>}

      <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
        {methods.map(method => (
          <div className="card" key={method.provider} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
            <div>
              <h2 style={{ margin: 0 }}>{labels[method.provider]?.title || method.provider}</h2>
              <p style={{ marginBottom: 0, color: "#6b7280" }}>
                {labels[method.provider]?.description}
              </p>
            </div>
            <button
              className={`button ${method.enabled ? "" : "secondary"}`}
              onClick={() => toggle(method.provider, !method.enabled)}
            >
              {method.enabled ? "Activado" : "Desactivado"}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <strong>Credenciales</strong>
        <p style={{ color: "#6b7280", marginBottom: 0 }}>
          Las API keys de Flow, Webpay y Mercado Pago se configuran en el servidor mediante variables de entorno.
          Nunca se exponen al navegador.
        </p>
      </div>
    </main>
  );
}

 "use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = [
  ["PENDING", "Pendiente"], ["PAID", "Pagado"], ["PREPARING", "Preparando"],
  ["SHIPPED", "Enviado"], ["DELIVERED", "Entregado"], ["CANCELLED", "Cancelado"]
];

export default function OrderStatus({ orderId, current }: { orderId: string; current: string }) {
  const router = useRouter(); const [value, setValue] = useState(current); const [saving, setSaving] = useState(false);
  async function change(next: string) {
    setValue(next); setSaving(true);
    const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    setSaving(false); if (!res.ok) { setValue(current); alert("No se pudo actualizar el pedido."); return; }
    router.refresh();
  }
  return <select className="input" style={{ width: 150, margin: 0 }} value={value} disabled={saving} onChange={e => change(e.target.value)}>
    {statuses.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
  </select>;
}
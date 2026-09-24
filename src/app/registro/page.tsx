 "use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Registro() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form))
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "No fue posible crear la cuenta.");
      return;
    }

    router.push("/onboarding");
  }

  return (
    <main className="container" style={{ padding: "70px 0", maxWidth: 560 }}>
      <div className="card">
        <h1>Crear mi tienda</h1>
        <p style={{ color: "#6b7280" }}>
          Crea tu cuenta y disfruta 30 días gratis para lanzar tu tienda.
        </p>

        <form onSubmit={submit}>
          <label className="label">Nombre</label>
          <input className="input" name="name" required />

          <label className="label">Correo electrónico</label>
          <input className="input" name="email" type="email" required />

          <label className="label">Contraseña</label>
          <input className="input" name="password" type="password" minLength={8} required />

          <label className="label">Nombre de la tienda</label>
          <input className="input" name="storeName" required />

          {error && <div className="error">{error}</div>}

          <button className="button" style={{ width: "100%", marginTop: 22 }} disabled={loading}>
            {loading ? "Creando..." : "Crear tienda"}
          </button>
        </form>
      </div>
    </main>
  );
}
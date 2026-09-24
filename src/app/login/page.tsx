 "use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form))
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Correo o contraseña incorrectos.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="container" style={{ padding: "70px 0", maxWidth: 560 }}>
      <div className="card">
        <h1>Iniciar sesión</h1>
        <form onSubmit={submit}>
          <label className="label">Correo electrónico</label>
          <input className="input" name="email" type="email" required />

          <label className="label">Contraseña</label>
          <input className="input" name="password" type="password" required />

          {error && <div className="error">{error}</div>}

          <button className="button" style={{ width: "100%", marginTop: 22 }}>
            Iniciar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
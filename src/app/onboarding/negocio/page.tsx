"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EMPTY_BUSINESS_INFO,
  normalizeBusinessInfo,
  validateBusinessInfo,
  type BusinessInfoInput,
} from "@/lib/business-info";

const steps = [
  ["1", "Información del negocio"],
  ["2", "Diseño de tu tienda"],
  ["3", "Productos"],
  ["4", "Pagos y despachos"],
  ["5", "Publicar"],
];

export default function BusinessInformationPage() {
  const router = useRouter();
  const [form, setForm] = useState<BusinessInfoInput>(EMPTY_BUSINESS_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/onboarding/business")
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No fue posible cargar la información.");
        setForm(normalizeBusinessInfo(data.business || {}));
      })
      .catch(error => setMessage(error.message || "No fue posible cargar la información."))
      .finally(() => setLoading(false));
  }, []);

  function update(field: keyof BusinessInfoInput, value: string) {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: "" }));
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeBusinessInfo(form);
    const clientErrors = validateBusinessInfo(normalized);
    setErrors(clientErrors);
    setMessage("");

    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      const response = await fetch("/api/onboarding/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors(data.fieldErrors || {});
        setMessage(data.error || "No fue posible guardar.");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setMessage("No fue posible guardar. Revisa tu conexión e inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="business-page"><div className="business-shell"><div className="business-card">Cargando información del negocio…</div></div></main>;
  }

  return (
    <main className="business-page">
      <div className="business-shell">
        <div className="business-head">
          <div>
            <a href="/onboarding" className="back">← Volver al onboarding</a>
            <div className="eyebrow">PASO 1 DE 5</div>
            <h1>Información del negocio</h1>
            <p>Cuéntanos lo esencial de tu negocio. Esta información se guardará en tu tienda y podrás actualizarla después.</p>
          </div>
          <div className="step-count">1 / 5</div>
        </div>

        <div className="stepper" aria-label="Progreso del onboarding">
          {steps.map(([number, title], index) => (
            <div className={index === 0 ? "step active" : "step"} key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="business-card">
          <section>
            <div className="section-title">
              <div>
                <h2>Datos principales</h2>
                <p>Los datos marcados con * son necesarios para completar este paso.</p>
              </div>
            </div>

            <div className="grid two">
              <Field label="Nombre del negocio *" name="businessName" value={form.businessName} error={errors.businessName} onChange={update} placeholder="Ej.: Popcorn Holy" />
              <Field label="Tipo de negocio *" name="businessType" value={form.businessType} error={errors.businessType} onChange={update} placeholder="Ej.: Alimentos y snacks" />
            </div>

            <label className="label">Descripción del negocio</label>
            <textarea
              className={errors.businessDescription ? "input invalid" : "input"}
              value={form.businessDescription}
              onChange={event => update("businessDescription", event.target.value)}
              placeholder="Describe brevemente qué vendes y qué hace especial a tu negocio."
              maxLength={500}
              rows={4}
            />
            <div className="counter">{form.businessDescription.length}/500</div>
          </section>

          <section>
            <div className="section-title">
              <div>
                <h2>Contacto</h2>
                <p>Usaremos estos datos para mostrar información de contacto y comunicaciones de tu tienda.</p>
              </div>
            </div>

            <div className="grid two">
              <Field label="Correo de contacto *" name="contactEmail" type="email" value={form.contactEmail} error={errors.contactEmail} onChange={update} placeholder="contacto@tunegocio.cl" />
              <Field label="Teléfono" name="phone" value={form.phone} error={errors.phone} onChange={update} placeholder="+56 9 1234 5678" />
              <Field label="Sitio web" name="website" value={form.website} error={errors.website} onChange={update} placeholder="www.tunegocio.cl" />
              <Field label="RUT (opcional)" name="rut" value={form.rut} error={errors.rut} onChange={update} placeholder="12.345.678-9" />
            </div>
          </section>

          <section>
            <div className="section-title">
              <div>
                <h2>Ubicación</h2>
                <p>La ubicación ayuda a configurar tu operación y despacho.</p>
              </div>
            </div>

            <div className="grid two">
              <Field label="País" name="country" value={form.country} error={errors.country} onChange={update} placeholder="Chile" />
              <Field label="Región" name="region" value={form.region} error={errors.region} onChange={update} placeholder="Región Metropolitana" />
              <Field label="Comuna / ciudad" name="commune" value={form.commune} error={errors.commune} onChange={update} placeholder="Ej.: San Bernardo" />
              <Field label="Dirección" name="address" value={form.address} error={errors.address} onChange={update} placeholder="Calle y número" />
            </div>
          </section>

          {message && <div className="message error">{message}</div>}

          <div className="actions">
            <a href="/onboarding" className="button secondary">Guardar más tarde</a>
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar y continuar →"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .business-page{min-height:100vh;background:#f7f8fa;padding:34px 20px 70px;color:#17202a}
        .business-shell{max-width:1040px;margin:0 auto}
        .business-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:24px}
        .back{display:inline-block;color:#344054;text-decoration:none;font-weight:700;margin-bottom:22px}
        .eyebrow{font-size:12px;font-weight:800;letter-spacing:.9px;color:#667085}
        h1{font-size:38px;line-height:1.12;margin:8px 0}
        .business-head p{max-width:700px;color:#667085;line-height:1.6;margin:0}
        .step-count{padding:10px 14px;border:1px solid #e4e7ec;border-radius:999px;background:#fff;font-weight:800;white-space:nowrap}
        .stepper{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:18px}
        .step{display:flex;align-items:center;gap:8px;padding:12px;border:1px solid #e4e7ec;border-radius:12px;background:#fff;color:#98a2b3;font-size:12px}
        .step span{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#f2f4f7;font-weight:800;flex:none}
        .step strong{font-size:12px}
        .step.active{border-color:#111827;color:#111827;box-shadow:0 1px 2px rgba(16,24,40,.05)}
        .step.active span{background:#111827;color:#fff}
        .business-card{background:#fff;border:1px solid #e4e7ec;border-radius:18px;padding:28px;box-shadow:0 4px 18px rgba(16,24,40,.04)}
        section+section{border-top:1px solid #eef0f2;margin-top:28px;padding-top:28px}
        .section-title h2{margin:0 0 5px;font-size:20px}
        .section-title p{margin:0 0 18px;color:#667085;font-size:14px;line-height:1.5}
        .grid{display:grid;gap:16px}.grid.two{grid-template-columns:1fr 1fr}
        .label{display:block;font-size:13px;font-weight:700;margin:0 0 7px}
        .input{width:100%;box-sizing:border-box;border:1px solid #d0d5dd;border-radius:10px;padding:11px 12px;background:#fff;color:#17202a;font:inherit}
        textarea.input{resize:vertical}
        .input:focus{outline:2px solid #dbeafe;border-color:#667085}
        .input.invalid{border-color:#d92d20}
        .counter{text-align:right;color:#98a2b3;font-size:11px;margin-top:5px}
        .field{display:flex;flex-direction:column}
        .field-error{color:#b42318;font-size:12px;margin-top:5px}
        .message{margin-top:22px;padding:12px;border-radius:10px;font-size:14px}
        .message.error{background:#fef3f2;color:#b42318;border:1px solid #fecdca}
        .actions{display:flex;justify-content:flex-end;gap:10px;margin-top:28px}
        .button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 17px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;border:1px solid transparent;cursor:pointer}
        .button.secondary{background:#fff;border-color:#d0d5dd;color:#344054}
        .button.primary{background:#111827;color:#fff}
        .button:disabled{opacity:.6;cursor:wait}
        @media(max-width:800px){.stepper{grid-template-columns:1fr 1fr}.step:last-child{grid-column:span 2}.grid.two{grid-template-columns:1fr}.business-head{display:block}.step-count{display:inline-block;margin-top:14px}.business-card{padding:20px}h1{font-size:31px}}
        @media(max-width:520px){.business-page{padding:22px 12px 50px}.stepper{grid-template-columns:1fr}.step:last-child{grid-column:auto}.actions{flex-direction:column}.button{width:100%}}
      `}</style>
    </main>
  );
}

function Field({
  label,
  name,
  value,
  error,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  name: keyof BusinessInfoInput;
  value: string;
  error?: string;
  onChange: (field: keyof BusinessInfoInput, value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="field">
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        className={error ? "input invalid" : "input"}
        type={type}
        value={value}
        onChange={event => onChange(name, event.target.value)}
        placeholder={placeholder}
        maxLength={name === "businessName" ? 100 : name === "businessType" ? 80 : undefined}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

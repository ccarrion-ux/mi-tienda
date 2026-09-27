function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable ${name}`);
  return value;
}

async function main() {
  const token = required("MERCADOPAGO_ACCESS_TOKEN");

  // Mercado Pago utiliza distintos prefijos según la solución/credencial.
  // Las credenciales de prueba documentadas actualmente pueden usar APP_USR
  // y algunas integraciones existentes utilizan TEST.
  if (!token.startsWith("APP_USR-") && !token.startsWith("TEST-")) {
    throw new Error(
      "El Access Token no tiene un prefijo de credencial de prueba reconocido (APP_USR- o TEST-). No se usará un token con otro formato."
    );
  }

  const idempotencyKey = crypto.randomUUID();
  const externalReference = `MT-MP-CI-${Date.now()}`;

  const response = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({
      type: "online",
      processing_mode: "manual",
      total_amount: "1000.00",
      external_reference: externalReference,
      payer: {
        email: "test@testuser.com"
      },
      items: [
        {
          title: "Mi Tienda - prueba de integración",
          quantity: 1,
          unit_price: "1000.00",
          total_amount: "1000.00",
          unit_measure: "unit"
        }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Mercado Pago respondió HTTP ${response.status}: ${JSON.stringify(data)}`
    );
  }

  if (!data?.id) {
    throw new Error("Mercado Pago no devolvió id de order.");
  }

  console.log("MERCADO PAGO INTEGRATION CREATE: PASS");
  console.log(`orderId=${data.id}`);
  console.log(`externalReference=${externalReference}`);
  console.log(`status=${data.status || "created"}`);
  console.log("No se realizó un cobro ni se usó una tarjeta real.");
}

main().catch((error) => {
  console.error(
    `MERCADO PAGO INTEGRATION CREATE: FAIL — ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});

import { webpayTransaction } from "../src/lib/webpay.ts";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable ${name}`);
  return value;
}

async function main() {
  required("WEBPAY_COMMERCE_CODE");
  required("WEBPAY_API_KEY");
  required("WEBPAY_ENV");

  if (process.env.WEBPAY_ENV !== "integration") {
    throw new Error("Esta prueba exige WEBPAY_ENV=integration.");
  }

  const tx = webpayTransaction();
  const suffix = Date.now().toString().slice(-8);
  const buyOrder = `MT-CI-${suffix}`.slice(0, 26);
  const sessionId = `MT-CI-${suffix}`;
  const amount = 1000;
  const returnUrl = "https://example.com/webpay-integration-return";

  const response = await tx.create(
    buyOrder,
    sessionId,
    amount,
    returnUrl
  );

  if (!response?.token || !response?.url) {
    throw new Error("Transbank no devolvió token ni URL de Webpay.");
  }

  console.log("WEBPAY INTEGRATION CREATE: PASS");
  console.log(`buyOrder=${buyOrder}`);
  console.log(`amount=${amount}`);
  console.log("token=received");
  console.log("url=received");
  console.log("No se realizó un cobro ni se ingresaron datos de tarjeta.");
}

main().catch((error) => {
  console.error(
    `WEBPAY INTEGRATION CREATE: FAIL — ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});

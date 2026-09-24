import {
  Environment,
  Options,
  WebpayPlus,
} from "transbank-sdk";

export function webpayTransaction() {
  const commerceCode = process.env.WEBPAY_COMMERCE_CODE;
  const apiKey = process.env.WEBPAY_API_KEY;
  const environment =
    process.env.WEBPAY_ENV === "production"
      ? Environment.Production
      : Environment.Integration;

  if (!commerceCode || !apiKey) {
    throw new Error("WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY no están configurados.");
  }

  return new WebpayPlus.Transaction(
    new Options(commerceCode, apiKey, environment)
  );
}

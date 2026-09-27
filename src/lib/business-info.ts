export type BusinessInfoInput = {
  businessName: string;
  businessType: string;
  businessDescription: string;
  contactEmail: string;
  phone: string;
  website: string;
  rut: string;
  country: string;
  region: string;
  commune: string;
  address: string;
};

export const EMPTY_BUSINESS_INFO: BusinessInfoInput = {
  businessName: "",
  businessType: "",
  businessDescription: "",
  contactEmail: "",
  phone: "",
  website: "",
  rut: "",
  country: "Chile",
  region: "",
  commune: "",
  address: "",
};

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export function normalizeBusinessInfo(input: Record<string, unknown>): BusinessInfoInput {
  return {
    businessName: clean(input.businessName, 100),
    businessType: clean(input.businessType, 80),
    businessDescription: clean(input.businessDescription, 500),
    contactEmail: clean(input.contactEmail, 160).toLowerCase(),
    phone: clean(input.phone, 30),
    website: clean(input.website, 200),
    rut: clean(input.rut, 20).toUpperCase().replace(/\s+/g, ""),
    country: clean(input.country, 80) || "Chile",
    region: clean(input.region, 100),
    commune: clean(input.commune, 100),
    address: clean(input.address, 200),
  };
}

export function isValidRut(value: string) {
  const normalized = value.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  const match = normalized.match(/^(\d{7,8})([0-9K])$/);
  if (!match) return false;

  const digits = match[1];
  const expected = match[2];
  let multiplier = 2;
  let sum = 0;

  for (let i = digits.length - 1; i >= 0; i--) {
    sum += Number(digits[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const check = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return check === expected;
}

export function validateBusinessInfo(input: BusinessInfoInput) {
  const errors: Record<string, string> = {};

  if (input.businessName.length < 2) errors.businessName = "Ingresa el nombre del negocio.";
  if (input.businessType.length < 2) errors.businessType = "Indica el tipo de negocio.";
  if (!input.contactEmail) errors.contactEmail = "Ingresa un correo de contacto.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail)) {
    errors.contactEmail = "Ingresa un correo válido.";
  }
  if (input.phone && !/^[+()\d\s.-]{7,30}$/.test(input.phone)) {
    errors.phone = "Ingresa un teléfono válido.";
  }
  if (input.website) {
    try {
      const url = new URL(input.website.startsWith("http") ? input.website : `https://${input.website}`);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      errors.website = "Ingresa una dirección web válida.";
    }
  }
  if (input.rut && !isValidRut(input.rut)) errors.rut = "El RUT no es válido.";

  return errors;
}

export function isBusinessInfoComplete(input: BusinessInfoInput) {
  const errors = validateBusinessInfo(input);
  return !errors.businessName && !errors.businessType && !errors.contactEmail;
}

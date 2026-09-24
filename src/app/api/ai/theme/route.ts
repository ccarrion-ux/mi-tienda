import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { defaultTheme } from "@/lib/theme";
import { getActiveStoreId } from "@/lib/store-context";

const themeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    brandName: { type: "string" },
    logoUrl: { type: "string" },
    primaryColor: { type: "string" },
    accentColor: { type: "string" },
    backgroundColor: { type: "string" },
    textColor: { type: "string" },
    fontFamily: { type: "string", enum: ["Inter", "Georgia", "Arial", "Trebuchet MS"] },
    hero: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean" },
        title: { type: "string" },
        subtitle: { type: "string" },
        imageUrl: { type: "string" },
        buttonText: { type: "string" },
        buttonUrl: { type: "string" }
      },
      required: ["enabled", "title", "subtitle", "imageUrl", "buttonText", "buttonUrl"]
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["featured-products", "categories", "text", "image"] },
          title: { type: "string" },
          text: { type: "string" },
          imageUrl: { type: "string" },
          limit: { type: "number" },
          enabled: { type: "boolean" }
        },
        required: ["id", "type", "title", "text", "imageUrl", "limit", "enabled"]
      }
    }
  },
  required: ["brandName", "logoUrl", "primaryColor", "accentColor", "backgroundColor", "textColor", "fontFamily", "hero", "sections"]
};

function safeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : "";
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const store = await prisma.store.findFirst({ where: { id: activeStoreId } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const body = await req.json();
  const prompt = String(body.prompt || "").trim().slice(0, 3000);
  if (!prompt) return NextResponse.json({ error: "Escribe qué tipo de tienda quieres crear." }, { status: 400 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: "Falta OPENAI_API_KEY. Agrega la clave en tu archivo .env.local para activar el asistente IA.",
      configured: false
    }, { status: 503 });
  }

  const current = body.currentTheme && typeof body.currentTheme === "object"
    ? body.currentTheme
    : defaultTheme(store.name);

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      store: false,
      instructions: [
        "Eres el asistente de diseño de una plataforma ecommerce llamada Mi Tienda.",
        "Responde en español.",
        "Crea una propuesta visual profesional, comercial y original.",
        "No inventes URLs de imágenes: deja imageUrl y logoUrl vacíos si el usuario no proporcionó URLs.",
        "Usa colores hex válidos.",
        "Mantén exactamente los tipos de sección permitidos.",
        "Devuelve solamente el objeto JSON solicitado."
      ].join(" "),
      input: `Tienda actual: ${store.name}
Solicitud del usuario: ${prompt}

Diseño actual:
${JSON.stringify(current)}`,
      text: {
        format: {
          type: "json_schema",
          name: "store_theme",
          strict: true,
          schema: themeSchema
        }
      }
    });

    const generated = JSON.parse(response.output_text);
    generated.logoUrl = safeUrl(generated.logoUrl || "");
    generated.hero.imageUrl = safeUrl(generated.hero.imageUrl || "");
    generated.sections = Array.isArray(generated.sections) ? generated.sections.slice(0, 8) : [];

    return NextResponse.json({ ok: true, theme: generated });
  } catch (error) {
    console.error("AI theme generation failed", error);
    return NextResponse.json({ error: "No fue posible generar el diseño con IA." }, { status: 500 });
  }
}

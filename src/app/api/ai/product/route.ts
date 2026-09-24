import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    shortDescription: { type: "string" },
    seoTitle: { type: "string" },
    seoDescription: { type: "string" },
    suggestedCategory: { type: "string" },
    keywords: { type: "array", items: { type: "string" } }
  },
  required: ["title", "description", "shortDescription", "seoTitle", "seoDescription", "suggestedCategory", "keywords"]
};

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const store = await prisma.store.findFirst({
    where: { id: activeStoreId },
    include: { categories: { select: { name: true } } }
  });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const body = await req.json();
  const productId = body.productId ? String(body.productId) : null;
  const product = productId
    ? await prisma.product.findFirst({ where: { id: productId, storeId: store.id }, include: { category: true } })
    : null;

  if (productId && !product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const input = body.product && typeof body.product === "object"
    ? body.product
    : product
      ? {
          name: product.name,
          description: product.description || "",
          category: product.category?.name || "",
          price: Number(product.price),
          sku: product.sku || ""
        }
      : null;

  if (!input?.name) {
    return NextResponse.json({ error: "Indica al menos el nombre del producto." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: "Falta OPENAI_API_KEY. Configúrala en .env.local para activar la IA.",
      configured: false
    }, { status: 503 });
  }

  const task = String(body.task || "full").slice(0, 40);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      store: false,
      instructions: [
        "Eres el asistente de catálogo de Mi Tienda, una plataforma ecommerce.",
        "Responde en español y escribe contenido comercial claro, concreto y natural.",
        "No inventes características técnicas, ingredientes, certificaciones, beneficios médicos, precios ni datos que no estén en la información entregada.",
        "Si faltan datos, redacta de forma neutral y evita afirmar algo no confirmado.",
        "Para categoría, usa una categoría existente cuando sea razonable; si ninguna encaja, propón una nueva.",
        "No uses emojis salvo que el usuario los pida.",
        "Devuelve solamente el JSON solicitado."
      ].join(" "),
      input: `Tarea: ${task}
Tienda: ${store.name}
Categorías existentes: ${store.categories.map(c => c.name).join(", ") || "ninguna"}

Producto:
${JSON.stringify(input)}`,
      text: {
        format: {
          type: "json_schema",
          name: "product_content",
          strict: true,
          schema
        }
      }
    });

    const result = JSON.parse(response.output_text);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("AI product generation failed", error);
    return NextResponse.json({ error: "No fue posible generar contenido para el producto." }, { status: 500 });
  }
}

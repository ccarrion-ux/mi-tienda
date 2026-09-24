import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { message } = await req.json();
    if (!message || String(message).length > 3000) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stores: { include: { categories: true } } },
    });
    const activeStoreId = await getActiveStoreId(userId);
  const store = user?.stores.find(s => s.id === activeStoreId);
    if (!store) return NextResponse.json({ error: "No tienes una tienda." }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Falta OPENAI_API_KEY. Configúrala para activar la IA." }, { status: 503 });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
    const response = await openai.responses.create({
      model,
      instructions: `Eres un asistente de Mi Tienda. Convierte la solicitud del usuario en una propuesta de acción.
Solo puedes proponer estas acciones:
1) create_product: crear un borrador de producto.
2) update_product_description: proponer una nueva descripción para un producto existente.
3) marketing_draft: preparar un borrador de campaña, sin publicarla.

Devuelve SOLO JSON válido, sin markdown, con:
{"action":"create_product|update_product_description|marketing_draft","title":"...","summary":"...","payload":{...}}
Para create_product payload debe contener name, description, price, stock, sku y categoryName.
Para update_product_description payload debe contener productName y description.
Para marketing_draft payload debe contener campaignName, objective, audience, message y cta.
Nunca inventes un precio si el usuario no lo indicó: usa 0 como propuesta y deja claro en summary que debe revisarse.
Nunca ejecutes nada. Esta respuesta será una PREVISUALIZACIÓN que el usuario deberá confirmar.`,
      input: `Tienda: ${store.name}
Categorías disponibles: ${store.categories.map(c => c.name).join(", ")}

Solicitud:
${String(message)}`,
    });

    let proposal;
    try {
      proposal = JSON.parse(response.output_text);
    } catch {
      return NextResponse.json({ error: "La IA no produjo una propuesta válida." }, { status: 502 });
    }

    return NextResponse.json({
      requiresConfirmation: true,
      proposal: {
        action: proposal.action,
        title: proposal.title,
        summary: proposal.summary,
        payload: proposal.payload,
        previewSlug: proposal.payload?.name ? slugify(proposal.payload.name) : null,
      },
    });
  } catch (error) {
    console.error("AI action error", error);
    return NextResponse.json({ error: "No fue posible preparar la acción." }, { status: 500 });
  }
}

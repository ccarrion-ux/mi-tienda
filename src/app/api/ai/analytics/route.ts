import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveStoreId } from "@/lib/store-context";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const activeStoreId = await getActiveStoreId(user.id);

    const body = await req.json().catch(() => ({}));
    const snapshot = body.snapshot;
    if (!snapshot) return NextResponse.json({ error: "Faltan datos de analítica" }, { status: 400 });

    const store = await prisma.store.findFirst({ where: { id: activeStoreId }, select: { name: true } });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: `Eres un analista de ecommerce para una tienda llamada ${store.name}. Analiza únicamente los datos entregados. No inventes cifras. Entrega observaciones claras y acciones prácticas para los próximos 7 días. No cambies precios ni ejecutes acciones. Diferencia hechos observados de recomendaciones.`,
        },
        {
          role: "user",
          content: JSON.stringify(snapshot),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "analytics_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              findings: { type: "array", items: { type: "string" } },
              opportunities: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } },
              next7Days: { type: "array", items: { type: "string" } }
            },
            required: ["findings", "opportunities", "risks", "next7Days"],
            additionalProperties: false
          }
        }
      }
    });

    return NextResponse.json(JSON.parse(response.output_text));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No fue posible generar los insights de IA" }, { status: 500 });
  }
}

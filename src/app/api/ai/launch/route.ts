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
    const business = String(body.business || "").trim();
    const style = String(body.style || "moderno").trim();
    if (!business) return NextResponse.json({ error: "Cuéntame qué vendes." }, { status: 400 });

    const store = await prisma.store.findFirst({ where: { id: activeStoreId }, select: { name: true } });
    if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: "Ayuda a un emprendedor a lanzar una tienda online. No ejecutes acciones. Propón una estructura inicial concreta, comercial y realista basada únicamente en lo que el usuario cuenta. Evita inventar datos específicos del negocio."
        },
        {
          role: "user",
          content: `Negocio: ${business}\nEstilo visual: ${style}\nNombre actual de la tienda: ${store.name}`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "launch_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              positioning: { type: "string" },
              categories: { type: "array", items: { type: "string" } },
              homepage: {
                type: "object",
                properties: {
                  heroTitle: { type: "string" },
                  heroSubtitle: { type: "string" },
                  cta: { type: "string" },
                  sections: { type: "array", items: { type: "string" } }
                },
                required: ["heroTitle", "heroSubtitle", "cta", "sections"],
                additionalProperties: false
              },
              starterProducts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    shortDescription: { type: "string" },
                    suggestedCategory: { type: "string" }
                  },
                  required: ["name", "shortDescription", "suggestedCategory"],
                  additionalProperties: false
                }
              },
              firstWeek: { type: "array", items: { type: "string" } }
            },
            required: ["positioning", "categories", "homepage", "starterProducts", "firstWeek"],
            additionalProperties: false
          }
        }
      }
    });

    return NextResponse.json(JSON.parse(response.output_text));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No fue posible generar el plan de lanzamiento" }, { status: 500 });
  }
}

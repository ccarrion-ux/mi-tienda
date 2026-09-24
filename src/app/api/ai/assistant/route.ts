import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const message = String(body.message || "").trim();
    if (!message) return NextResponse.json({ error: "Escribe una consulta." }, { status: 400 });
    if (message.length > 3000) return NextResponse.json({ error: "La consulta es demasiado larga." }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stores: {
          include: {
            products: { where: { active: true }, take: 30 },
            categories: { take: 30 },
            orders: { orderBy: { createdAt: "desc" }, take: 50 },
          },
        },
      },
    });

    const activeStoreId = await getActiveStoreId(userId);
  const store = user?.stores.find(s => s.id === activeStoreId);
    if (!store) return NextResponse.json({ error: "No tienes una tienda configurada." }, { status: 400 });

    const snapshot = {
      store: { name: store.name, slug: store.slug },
      products: store.products.map((p) => ({
        name: p.name, price: Number(p.price), stock: p.stock, sku: p.sku, active: p.active,
      })),
      categories: store.categories.map((c) => c.name),
      recentOrders: store.orders.map((o) => ({
        status: o.status, total: Number(o.total), createdAt: o.createdAt.toISOString(),
      })),
    };

    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
    const response = await openai.responses.create({
      model,
      instructions: `Eres el asistente de negocio de Mi Tienda. Ayudas al dueño de una tienda a entender su catálogo, ventas y tareas.
Usa exclusivamente los datos entregados como contexto para afirmar cifras concretas. Si falta información, dilo.
No ejecutes cambios, no modifiques precios, no publiques campañas y no inventes datos.
Responde en español, de forma clara y accionable.`,
      input: `CONTEXTO DE LA TIENDA:
${JSON.stringify(snapshot)}

CONSULTA DEL DUEÑO:
${message}`,
    });

    return NextResponse.json({ answer: response.output_text, store: store.name });
  } catch (error) {
    console.error("AI assistant error", error);
    return NextResponse.json({ error: "No fue posible responder en este momento." }, { status: 500 });
  }
}

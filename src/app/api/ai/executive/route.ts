import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const request = String(body.request || "Analiza mi tienda y propón una acción prioritaria.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { stores: { include: {
      products: { where: { active: true }, take: 80 },
      orders: { orderBy: { createdAt: "desc" }, take: 80 },
      categories: { take: 30 }
    }}}
  });
  const activeStoreId = await getActiveStoreId(userId);
  const store = user?.stores.find(s => s.id === activeStoreId);
  if (!store) return NextResponse.json({ error: "No hay tienda" }, { status: 404 });

  const lowStock = store.products.filter(p => p.stock <= 5).map(p => ({ name: p.name, stock: p.stock }));
  const pendingOrders = store.orders.filter(o => o.status === "PENDING").length;
  const sales = store.orders.filter(o => o.status !== "CANCELLED").reduce((s,o) => s + Number(o.total), 0);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Falta OPENAI_API_KEY. Configúrala para activar la IA." }, { status: 503 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const response = await openai.responses.create({
    model,
    input: [
      { role: "system", content: "Eres el asistente ejecutivo de una plataforma ecommerce. Analiza datos reales y propone UNA acción concreta. Nunca ejecutes cambios. Debes explicar qué se haría, por qué, impacto esperado como hipótesis y qué debe confirmar el usuario. No inventes datos." },
      { role: "user", content: JSON.stringify({
        request,
        store: store.name,
        metrics: { activeProducts: store.products.length, pendingOrders, sales, lowStock },
        categories: store.categories.map(c => c.name)
      }) }
    ],
    text: { format: { type: "json_schema", name: "executive_proposal", strict: true, schema: {
      type: "object", additionalProperties: false,
      properties: {
        title: { type: "string" },
        reason: { type: "string" },
        actionType: { type: "string", enum: ["product", "inventory", "order", "marketing", "analytics"] },
        action: { type: "string" },
        preview: { type: "string" },
        expectedImpact: { type: "string" },
        requiresConfirmation: { type: "boolean" }
      },
      required: ["title","reason","actionType","action","preview","expectedImpact","requiresConfirmation"]
    }}}
  });
  const proposal = JSON.parse(response.output_text);
  return NextResponse.json({ proposal: { ...proposal, requiresConfirmation: true } });
}

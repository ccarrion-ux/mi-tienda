import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    priorities: { type: "array", items: { type: "string" } },
    campaigns: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          objective: { type: "string" },
          audience: { type: "string" },
          offer: { type: "string" },
          channel: { type: "string" },
          message: { type: "string" },
          callToAction: { type: "string" }
        },
        required: ["name", "objective", "audience", "offer", "channel", "message", "callToAction"]
      }
    },
    crossSell: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          product: { type: "string" },
          recommendation: { type: "string" },
          reason: { type: "string" }
        },
        required: ["product", "recommendation", "reason"]
      }
    },
    content: {
      type: "object",
      additionalProperties: false,
      properties: {
        socialPost: { type: "string" },
        emailSubject: { type: "string" },
        emailBody: { type: "string" },
        bannerTitle: { type: "string" },
        bannerSubtitle: { type: "string" }
      },
      required: ["socialPost", "emailSubject", "emailBody", "bannerTitle", "bannerSubtitle"]
    }
  },
  required: ["summary", "priorities", "campaigns", "crossSell", "content"]
};

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const store = await prisma.store.findFirst({
    where: { id: activeStoreId },
    include: {
      products: {
        where: { active: true },
        select: { id: true, name: true, price: true, stock: true, category: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100
      },
      orders: {
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: 100
      }
    }
  });

  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: "Falta OPENAI_API_KEY. Configúrala en .env.local para activar la IA.",
      configured: false
    }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const request = String(body.request || "Analiza la tienda y propón acciones de marketing para esta semana.").slice(0, 3000);

  const productSales = new Map<string, { name: string; units: number; revenue: number }>();
  for (const order of store.orders) {
    for (const item of order.items) {
      if (!item.product) continue;
      const current = productSales.get(item.product.id) || { name: item.product.name, units: 0, revenue: 0 };
      current.units += item.quantity;
      current.revenue += Number(item.unitPrice) * item.quantity;
      productSales.set(item.product.id, current);
    }
  }

  const topProducts = [...productSales.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const totalSales = store.orders.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrder = store.orders.length ? totalSales / store.orders.length : 0;
  const lowStock = store.products.filter(p => p.stock > 0 && p.stock <= 5).map(p => p.name);

  const snapshot = {
    store: store.name,
    request,
    metrics: {
      ordersAnalyzed: store.orders.length,
      salesAnalyzed: Math.round(totalSales),
      averageOrder: Math.round(avgOrder),
      activeProducts: store.products.length,
      lowStockProducts: lowStock
    },
    catalog: store.products.map(p => ({
      name: p.name,
      price: Number(p.price),
      stock: p.stock,
      category: p.category?.name || "Sin categoría"
    })),
    topProducts
  };

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      store: false,
      instructions: [
        "Eres el asistente de ventas y marketing de Mi Tienda.",
        "Responde en español.",
        "Usa únicamente los datos entregados como base factual.",
        "No inventes descuentos, porcentajes, clientes, productos ni resultados.",
        "Puedes proponer ideas, pero marca como propuesta cualquier dato que no exista.",
        "No hagas promesas de ventas ni predicciones de resultados.",
        "Si no hay suficientes pedidos, indícalo y enfoca las recomendaciones en catálogo y contenido.",
        "Devuelve solamente el JSON solicitado."
      ].join(" "),
      input: JSON.stringify(snapshot),
      text: {
        format: {
          type: "json_schema",
          name: "marketing_plan",
          strict: true,
          schema
        }
      }
    });

    return NextResponse.json({ ok: true, result: JSON.parse(response.output_text), snapshot });
  } catch (error) {
    console.error("AI marketing generation failed", error);
    return NextResponse.json({ error: "No fue posible generar el plan de marketing." }, { status: 500 });
  }
}

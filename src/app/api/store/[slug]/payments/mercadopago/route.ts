import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const orderId = String(body.orderId || "");

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token || !appUrl) {
    return NextResponse.json({
      error: "Mercado Pago aún no está configurado. Agrega MERCADOPAGO_ACCESS_TOKEN y NEXT_PUBLIC_APP_URL."
    }, { status: 503 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, store: { slug } },
    include: { customer: true, items: { include: { product: true } } }
  });

  if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });

  const payment = await prisma.payment.findUnique({ where: { orderId: order.id } });
  if (!payment || payment.provider !== "MERCADOPAGO") {
    return NextResponse.json({ error: "El pedido no está configurado para Mercado Pago." }, { status: 400 });
  }

  const idempotencyKey = crypto.randomUUID();

  const response = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({
      type: "online",
      processing_mode: "manual",
      capture_mode: "automatic",
      total_amount: Number(order.total).toFixed(2),
      external_reference: order.id,
      payer: { email: order.customer?.email || undefined },
      items: order.items.map(item => ({
        title: item.product?.name || "Producto",
        quantity: item.quantity,
        unit_price: Number(item.unitPrice).toFixed(2),
        total_amount: (Number(item.unitPrice) * item.quantity).toFixed(2),
        unit_measure: "unit"
      })),
      config: {
        redirect_urls: {
          success: `${appUrl}/tienda/${slug}/pedido/${order.id}?payment=success`,
          pending: `${appUrl}/tienda/${slug}/pedido/${order.id}?payment=pending`,
          failure: `${appUrl}/tienda/${slug}/pedido/${order.id}?payment=failure`
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({
      error: data?.message || "Mercado Pago rechazó la creación del checkout.",
      details: data
    }, { status: 502 });
  }

  const checkoutUrl = data.checkout_url || data.init_point || null;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { externalId: data.id ? String(data.id) : null, checkoutUrl }
  });

  return NextResponse.json({ checkoutUrl });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { flowBaseUrl, flowSignedParams } from "@/lib/flow";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { orderId } = await req.json();

  const apiKey = process.env.FLOW_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiKey || !process.env.FLOW_SECRET_KEY || !appUrl) {
    return NextResponse.json({
      error: "Flow no está configurado. Completa FLOW_API_KEY, FLOW_SECRET_KEY y NEXT_PUBLIC_APP_URL."
    }, { status: 503 });
  }

  const order = await prisma.order.findFirst({
    where: { id: String(orderId), store: { slug } },
    include: { customer: true, payment: true }
  });

  if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  if (!order.payment || order.payment.provider !== "FLOW") {
    return NextResponse.json({ error: "El pedido no está configurado para Flow." }, { status: 400 });
  }

  const paramsToSign = {
    apiKey,
    commerceOrder: order.id,
    subject: `Pedido #${order.number} - ${order.storeId}`,
    currency: "CLP",
    amount: Math.round(Number(order.total)),
    email: order.customer?.email || "",
    urlConfirmation: `${appUrl}/api/webhooks/flow`,
    urlReturn: `${appUrl}/api/payments/flow/return`,
    paymentMethod: 9,
  };

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(flowSignedParams(paramsToSign))) {
    body.set(key, String(value));
  }

  const response = await fetch(`${flowBaseUrl()}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store"
  });

  const data = await response.json();
  if (!response.ok || !data?.url || !data?.token) {
    return NextResponse.json({
      error: data?.message || "Flow rechazó la creación de la orden de pago.",
      details: data
    }, { status: 502 });
  }

  const checkoutUrl = `${data.url}?token=${encodeURIComponent(data.token)}`;

  await prisma.payment.update({
    where: { id: order.payment.id },
    data: {
      externalId: String(data.flowOrder || data.token),
      checkoutUrl
    }
  });

  return NextResponse.json({ checkoutUrl });
}

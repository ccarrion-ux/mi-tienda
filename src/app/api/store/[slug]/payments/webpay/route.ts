import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayTransaction } from "@/lib/webpay";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { orderId } = await req.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL no está configurado." }, { status: 503 });
  }

  const order = await prisma.order.findFirst({
    where: { id: String(orderId), store: { slug } },
    include: { payment: true }
  });

  if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  if (!order.payment || order.payment.provider !== "WEBPAY") {
    return NextResponse.json({ error: "El pedido no está configurado para Webpay." }, { status: 400 });
  }

  try {
    const tx = webpayTransaction();
    const buyOrder = `MT-${order.number}-${order.id.slice(-8)}`.slice(0, 26);
    const sessionId = `MT-${order.id}`.slice(0, 61);
    const returnUrl = `${appUrl}/api/webhooks/webpay`;

    const response = await tx.create(
      buyOrder,
      sessionId,
      Math.round(Number(order.total)),
      returnUrl
    );

    await prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        externalId: response.token
      }
    });

    return NextResponse.json({
      url: response.url,
      token: response.token
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "No fue posible crear la transacción Webpay."
    }, { status: 502 });
  }
}

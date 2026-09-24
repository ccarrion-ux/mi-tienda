import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayTransaction } from "@/lib/webpay";

export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token_ws") || "");
  const tbkToken = String(form.get("TBK_TOKEN") || "");

  // A normal Webpay Plus flow returns token_ws.
  // Cancellation/abandonment may return TBK_TOKEN; do not mark the order as paid.
  if (!token && tbkToken) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (!token) return NextResponse.redirect(new URL("/", req.url));

  try {
    const tx = webpayTransaction();
    const result = await tx.commit(token);

    const payment = await prisma.payment.findFirst({
      where: { externalId: token, provider: "WEBPAY" },
      include: { order: { include: { store: true } } }
    });

    if (!payment) return NextResponse.redirect(new URL("/", req.url));

    const authorized = result.response_code === 0 && result.status === "AUTHORIZED";

    await prisma.$transaction(async db => {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: authorized ? "PAID" : "FAILED",
          externalId: token
        }
      });

      if (authorized && payment.order.status === "PENDING") {
        await db.order.update({
          where: { id: payment.order.id },
          data: { status: "PAID" }
        });
      }

      if (!authorized && payment.order.status === "PENDING") {
        await db.order.update({
          where: { id: payment.order.id },
          data: { status: "CANCELLED" }
        });
      }
    });

    return NextResponse.redirect(
      new URL(`/tienda/${payment.order.store.slug}/pedido/${payment.order.id}?payment=webpay`, req.url)
    );
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export async function GET() {
  return NextResponse.json({ error: "Webpay callback debe ser POST." }, { status: 405 });
}

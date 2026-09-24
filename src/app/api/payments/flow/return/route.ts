import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { flowBaseUrl, flowSignedParams } from "@/lib/flow";

export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token") || "");
  if (!token) return NextResponse.redirect(new URL("/", req.url));

  const apiKey = process.env.FLOW_API_KEY;
  if (!apiKey || !process.env.FLOW_SECRET_KEY) return NextResponse.redirect(new URL("/", req.url));

  const signed = flowSignedParams({ apiKey, token });
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(signed)) query.set(key, String(value));

  const response = await fetch(`${flowBaseUrl()}/payment/getStatus?${query.toString()}`, {
    cache: "no-store"
  });
  const data = await response.json();
  const orderId = String(data?.commerceOrder || "");

  if (orderId) {
    await prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { payment: true } });
      if (!order?.payment || order.payment.provider !== "FLOW") return;

      const status = String(data?.status || "");
      if (status === "2") {
        await tx.payment.update({ where: { id: order.payment.id }, data: { status: "PAID", externalId: String(data?.flowOrder || token) } });
        if (order.status === "PENDING") await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
      }
    });

    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const slug = await prisma.order.findUnique({ where: { id: orderId }, select: { store: { select: { slug: true } } } });
    if (slug?.store.slug) {
      return NextResponse.redirect(new URL(`/tienda/${slug.store.slug}/pedido/${orderId}?payment=flow`, base));
    }
  }

  return NextResponse.redirect(new URL("/", req.url));
}

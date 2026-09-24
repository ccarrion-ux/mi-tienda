import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { flowBaseUrl, flowSignedParams } from "@/lib/flow";

export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token") || "");
  if (!token) return new NextResponse("OK", { status: 200 });

  const apiKey = process.env.FLOW_API_KEY;
  if (!apiKey || !process.env.FLOW_SECRET_KEY) {
    return NextResponse.json({ error: "Flow no configurado." }, { status: 503 });
  }

  const signed = flowSignedParams({ apiKey, token });
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(signed)) query.set(key, String(value));

  const response = await fetch(`${flowBaseUrl()}/payment/getStatus?${query.toString()}`, {
    method: "GET",
    cache: "no-store"
  });
  const data = await response.json();

  if (!response.ok) return NextResponse.json({ error: "No fue posible consultar el estado en Flow." }, { status: 502 });

  const commerceOrder = String(data?.commerceOrder || "");
  const order = await prisma.order.findUnique({
    where: { id: commerceOrder },
    include: { payment: true }
  });

  if (!order?.payment || order.payment.provider !== "FLOW") {
    return new NextResponse("OK", { status: 200 });
  }

  const status = String(data?.status || "");
  const paymentStatus =
    status === "2" ? "PAID" :
    status === "3" || status === "4" ? "FAILED" :
    status === "5" ? "REFUNDED" :
    "PENDING";

  await prisma.$transaction(async tx => {
    await tx.payment.update({
      where: { id: order.payment!.id },
      data: {
        status: paymentStatus as "PENDING" | "PAID" | "FAILED" | "REFUNDED",
        externalId: String(data?.flowOrder || token)
      }
    });

    if (paymentStatus === "PAID" && order.status === "PENDING") {
      await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
    }
    if (paymentStatus === "FAILED" && order.status === "PENDING") {
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    }
  });

  return new NextResponse("OK", { status: 200 });
}

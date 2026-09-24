import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

function parseSignature(value: string | null) {
  if (!value) return { ts: null, v1: null };
  let ts: string | null = null;
  let v1: string | null = null;

  for (const part of value.split(",")) {
    const [key, ...rest] = part.split("=");
    const val = rest.join("=").trim();
    if (key?.trim() === "ts") ts = val;
    if (key?.trim() === "v1") v1 = val;
  }
  return { ts, v1 };
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

async function verifyMercadoPagoSignature(req: Request, dataId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const signature = parseSignature(req.headers.get("x-signature"));
  const requestId = req.headers.get("x-request-id") || "";

  if (!signature.ts || !signature.v1) return false;

  // Mercado Pago: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  // data.id is normalized to lowercase for the manifest.
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${signature.ts};`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return safeEqual(expected, signature.v1);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") || "";
  const type = url.searchParams.get("type") || "";

  if (!dataId || type !== "order") {
    return NextResponse.json({ ok: true });
  }

  const valid = await verifyMercadoPagoSignature(req, dataId);
  if (!valid) {
    return NextResponse.json({ error: "Firma de Mercado Pago inválida." }, { status: 401 });
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Mercado Pago no está configurado." }, { status: 503 });
  }

  // Respond only after validating the signature; then retrieve the current order.
  const mpResponse = await fetch(
    `https://api.mercadopago.com/v1/orders/${encodeURIComponent(dataId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    }
  );

  if (!mpResponse.ok) {
    return NextResponse.json({ error: "No fue posible consultar la order en Mercado Pago." }, { status: 502 });
  }

  const mpOrder = await mpResponse.json();
  const localOrderId = String(mpOrder.external_reference || "");

  if (!localOrderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const localOrder = await prisma.order.findUnique({
    where: { id: localOrderId },
    include: { payment: true }
  });

  if (!localOrder?.payment) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Orders API status values can evolve; map the known final states and
  // leave unknown/intermediate states pending instead of guessing.
  const status = String(mpOrder.status || "").toLowerCase();
  let paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" = "PENDING";

  if (["processed", "approved", "completed"].includes(status)) {
    paymentStatus = "PAID";
  } else if (["failed", "rejected", "cancelled", "canceled"].includes(status)) {
    paymentStatus = "FAILED";
  } else if (["refunded", "refunded_partially"].includes(status)) {
    paymentStatus = "REFUNDED";
  }

  await prisma.$transaction(async tx => {
    await tx.payment.update({
      where: { id: localOrder.payment!.id },
      data: {
        status: paymentStatus,
        externalId: String(mpOrder.id || dataId)
      }
    });

    if (paymentStatus === "PAID" && localOrder.status === "PENDING") {
      await tx.order.update({
        where: { id: localOrder.id },
        data: { status: "PAID" }
      });
    }

    if (paymentStatus === "FAILED" && localOrder.status === "PENDING") {
      await tx.order.update({
        where: { id: localOrder.id },
        data: { status: "CANCELLED" }
      });
    }
  });

  return NextResponse.json({ ok: true });
}

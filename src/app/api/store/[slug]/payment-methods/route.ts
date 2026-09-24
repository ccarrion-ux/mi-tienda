import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug, status: "ACTIVE" } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const configs = await prisma.paymentMethodConfig.findMany({
    where: { storeId: store.id, enabled: true }
  });

  const defaults = configs.length ? configs : [{
    provider: "TRANSFER",
    displayName: "Transferencia bancaria"
  }];

  return NextResponse.json({
    paymentMethods: defaults.map((p: any) => ({
      provider: p.provider,
      displayName: p.displayName || (
        p.provider === "FLOW" ? "Flow" :
        p.provider === "WEBPAY" ? "Webpay" :
        p.provider === "MERCADOPAGO" ? "Mercado Pago" :
        p.provider === "TEST" ? "Pago de prueba" :
        "Transferencia bancaria"
      )
    }))
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug, status: "ACTIVE" } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const methods = await prisma.shippingMethod.findMany({
    where: { storeId: store.id, active: true },
    orderBy: { price: "asc" }
  });

  return NextResponse.json({
    shippingMethods: methods.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      price: Number(m.price)
    }))
  });
}

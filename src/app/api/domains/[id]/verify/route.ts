import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";
import { promises as dns } from "node:dns";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const activeStoreId = await getActiveStoreId(userId);
  if (!activeStoreId) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const { id } = await params;
  const domain = await prisma.storeDomain.findFirst({
    where: { id, storeId: activeStoreId },
  });
  if (!domain) return NextResponse.json({ error: "Dominio no encontrado" }, { status: 404 });

  try {
    const records = await dns.resolveTxt(`_mi-tienda-verification.${domain.domain}`);
    const values = records.flat();
    if (!values.includes(domain.token)) {
      return NextResponse.json({
        verified: false,
        error: "No encontramos el TXT esperado todavía.",
      }, { status: 400 });
    }

    const updated = await prisma.storeDomain.update({
      where: { id: domain.id },
      data: { status: "VERIFIED", verifiedAt: new Date() },
    });

    return NextResponse.json({ verified: true, domain: updated });
  } catch {
    return NextResponse.json({
      verified: false,
      error: "No pudimos consultar el DNS. Verifica que el registro TXT ya esté publicado.",
    }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await params;

  const store = await prisma.store.findFirst({ where: { id: activeStoreId } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const media = await prisma.storeMedia.findFirst({ where: { id, storeId: store.id } });
  if (!media) return NextResponse.json({ error: "Imagen no encontrada." }, { status: 404 });

  await prisma.storeMedia.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

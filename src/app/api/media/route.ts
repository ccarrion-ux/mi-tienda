import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

export async function GET() {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const store = await prisma.store.findFirst({ where: { id: activeStoreId } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const media = await prisma.storeMedia.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ media });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const activeStoreId = await getActiveStoreId(userId);

  const store = await prisma.store.findFirst({ where: { id: activeStoreId } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  const url = String(body.url || "").trim();
  const alt = body.alt ? String(body.alt).trim() : null;

  if (!name || !url) return NextResponse.json({ error: "Nombre y URL son obligatorios." }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "La imagen debe usar una URL http o https." }, { status: 400 });
  }

  const media = await prisma.storeMedia.create({
    data: { name, url, alt, storeId: store.id }
  });
  return NextResponse.json({ media }, { status: 201 });
}

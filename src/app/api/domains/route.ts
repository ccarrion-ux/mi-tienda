import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

export async function GET() {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const store = await prisma.store.findFirst({ where: { id: activeStoreId } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  return NextResponse.json({ domains: await prisma.storeDomain.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" } }) });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const activeStoreId = await getActiveStoreId(userId);
  const store = await prisma.store.findFirst({ where: { id: activeStoreId || "", ownerId: userId, status: "ACTIVE" } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const domain = String(body.domain || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!domain || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) return NextResponse.json({ error: "Dominio no válido" }, { status: 400 });
  const existing = await prisma.storeDomain.findUnique({ where: { domain } });
  if (existing && existing.storeId !== store.id) return NextResponse.json({ error: "Ese dominio ya está registrado" }, { status: 409 });
  const record = existing || await prisma.storeDomain.create({ data: { domain, storeId: store.id } });
  return NextResponse.json({ domain: record, verification: { type: "TXT", host: "_mi-tienda-verification", value: record.token, note: "Configura este TXT en DNS y verifica desde el panel cuando la infraestructura de producción esté conectada." } });
}

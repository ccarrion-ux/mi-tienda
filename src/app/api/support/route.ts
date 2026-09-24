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
  return NextResponse.json({ tickets: await prisma.supportTicket.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" } }) });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const activeStoreId = await getActiveStoreId(userId);
  const store = await prisma.store.findFirst({ where: { id: activeStoreId } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  if (subject.length < 3 || message.length < 10) return NextResponse.json({ error: "Completa asunto y mensaje" }, { status: 400 });
  const ticket = await prisma.supportTicket.create({ data: { subject: subject.slice(0, 160), message: message.slice(0, 5000), storeId: store.id } });
  return NextResponse.json({ ticket }, { status: 201 });
}

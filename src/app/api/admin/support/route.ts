import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform-admin";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId || !(await isPlatformAdmin(userId))) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  const tickets = await prisma.supportTicket.findMany({ include: { store: { select: { name: true, slug: true, owner: { select: { email: true } } } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ tickets });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId || !(await isPlatformAdmin(userId))) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const status = body.status;
  if (!id || !["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const ticket = await prisma.supportTicket.update({ where: { id }, data: { status } });
  return NextResponse.json({ ticket });
}

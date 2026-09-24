import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";

export async function GET() {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso de administrador requerido" }, { status: 403 });

  const stores = await prisma.store.findMany({
    include: { owner: { select: { id: true, name: true, email: true } }, subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(stores);
}

export async function PATCH(req: Request) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Acceso de administrador requerido" }, { status: 403 });

  const { storeId, action } = await req.json();
  if (!storeId || !["suspend", "reactivate"].includes(action)) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const store = await prisma.store.findUnique({ where: { id: storeId }, include: { subscription: true } });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });

  const updated = await prisma.store.update({
    where: { id: storeId },
    data: action === "suspend" ? { status: "SUSPENDED", suspendedAt: new Date() } : { status: "ACTIVE", suspendedAt: null },
    include: { subscription: { include: { plan: true } } },
  });

  await prisma.platformAuditLog.create({
    data: {
      adminUserId: admin.user.id,
      action: action === "suspend" ? "SUSPEND_STORE" : "REACTIVATE_STORE",
      targetType: "STORE",
      targetId: storeId,
      details: { role: admin.role },
    },
  });

  return NextResponse.json(updated);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";
import {
  normalizeBusinessInfo,
  validateBusinessInfo,
  isBusinessInfoComplete,
  type BusinessInfoInput,
} from "@/lib/business-info";

function toResponse(store: any, fallbackEmail: string) {
  return {
    businessName: store.businessName || store.name || "",
    businessType: store.businessType || "",
    businessDescription: store.businessDescription || "",
    contactEmail: store.contactEmail || fallbackEmail || "",
    phone: store.phone || "",
    website: store.website || "",
    rut: store.rut || "",
    country: store.country || "Chile",
    region: store.region || "",
    commune: store.commune || "",
    address: store.address || "",
    completed: Boolean(store.businessInfoCompletedAt),
    completedAt: store.businessInfoCompletedAt,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const storeId = await getActiveStoreId(user.id);
  if (!storeId) return NextResponse.json({ error: "No hay una tienda activa." }, { status: 404 });

  const store = await prisma.store.findFirst({
    where: { id: storeId, ownerId: user.id, status: "ACTIVE" },
  });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  return NextResponse.json({ business: toResponse(store, user.email) });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const storeId = await getActiveStoreId(user.id);
  if (!storeId) return NextResponse.json({ error: "No hay una tienda activa." }, { status: 404 });

  const store = await prisma.store.findFirst({
    where: { id: storeId, ownerId: user.id, status: "ACTIVE" },
  });
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El contenido enviado no es válido." }, { status: 400 });
  }

  const business = normalizeBusinessInfo(body);
  const errors = validateBusinessInfo(business);
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Revisa la información del negocio.", fieldErrors: errors }, { status: 422 });
  }

  const saved = await prisma.store.update({
    where: { id: store.id },
    data: {
      businessName: business.businessName,
      businessType: business.businessType,
      businessDescription: business.businessDescription || null,
      contactEmail: business.contactEmail,
      phone: business.phone || null,
      website: business.website || null,
      rut: business.rut || null,
      country: business.country,
      region: business.region || null,
      commune: business.commune || null,
      address: business.address || null,
      businessInfoCompletedAt: isBusinessInfoComplete(business) ? new Date() : null,
    },
  });

  return NextResponse.json({
    ok: true,
    business: toResponse(saved, user.email),
  });
}

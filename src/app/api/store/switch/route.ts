import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STORE_COOKIE } from "@/lib/store-context";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { storeId } = await req.json().catch(() => ({}));
  if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

  const store = await prisma.store.findFirst({
    where: { id: storeId, ownerId: userId, status: "ACTIVE" },
    select: { id: true, name: true, slug: true },
  });

  if (!store) return NextResponse.json({ error: "Tienda no autorizada" }, { status: 403 });

  const response = NextResponse.json({ ok: true, store });
  response.cookies.set(ACTIVE_STORE_COOKIE, store.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

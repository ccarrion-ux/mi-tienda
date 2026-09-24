import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { defaultTheme } from "@/lib/theme";
import { getActiveStoreId } from "@/lib/store-context";

async function getStore(userId: string) {
  const activeStoreId = await getActiveStoreId(userId);
  if (!activeStoreId) return null;
  return prisma.store.findFirst({ where: { id: activeStoreId, ownerId: userId, status: "ACTIVE" } });
}

export async function GET() {
  const userId = await getSessionUserId();
  const activeStoreId = await getActiveStoreId(userId || "");
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const store = await getStore(userId);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  let record = await prisma.storeTheme.findUnique({ where: { storeId: store.id } });
  if (!record) {
    const initial = defaultTheme(store.name);
    record = await prisma.storeTheme.create({
      data: { storeId: store.id, theme: initial, draftTheme: initial, publishedTheme: initial, published: true }
    });
  }

  return NextResponse.json({
    theme: record.draftTheme || record.theme,
    publishedTheme: record.publishedTheme || record.theme,
    published: record.published,
    storeSlug: store.slug,
    storeName: store.name
  });
}

export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const store = await getStore(userId);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const body = await req.json();
  if (!body.theme || typeof body.theme !== "object") {
    return NextResponse.json({ error: "Configuración visual inválida." }, { status: 400 });
  }

  const saved = await prisma.storeTheme.upsert({
    where: { storeId: store.id },
    create: {
      storeId: store.id,
      theme: body.theme,
      draftTheme: body.theme,
      publishedTheme: body.theme,
      published: false
    },
    update: { theme: body.theme, draftTheme: body.theme }
  });

  return NextResponse.json({
    ok: true,
    theme: saved.draftTheme || saved.theme,
    published: saved.published,
    storeSlug: store.slug
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const store = await getStore(userId);
  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const record = await prisma.storeTheme.findUnique({ where: { storeId: store.id } });
  if (!record) return NextResponse.json({ error: "No existe un diseño para publicar." }, { status: 404 });

  if (body.action === "publish") {
    const draft = record.draftTheme || record.theme;
    const saved = await prisma.storeTheme.update({
      where: { storeId: store.id },
      data: { theme: draft, publishedTheme: draft, published: true, publishedAt: new Date() }
    });
    return NextResponse.json({ ok: true, published: true, theme: saved.publishedTheme });
  }

  if (body.action === "unpublish") {
    const saved = await prisma.storeTheme.update({
      where: { storeId: store.id },
      data: { published: false }
    });
    return NextResponse.json({ ok: true, published: saved.published });
  }

  return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
}

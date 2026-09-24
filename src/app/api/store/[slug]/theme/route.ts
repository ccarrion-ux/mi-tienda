import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultTheme } from "@/lib/theme";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug, status: "ACTIVE" },
    include: { theme: true }
  });

  if (!store) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });

  const record = store.theme;
  const theme = record?.published && (record.publishedTheme || record.theme)
    ? (record.publishedTheme || record.theme)
    : defaultTheme(store.name);

  return NextResponse.json({ theme, published: record?.published ?? true });
}

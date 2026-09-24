import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const activeStoreId = await getActiveStoreId(userId);

  const categories = await prisma.category.findMany({
    where: { storeId: activeStoreId || "" },
    orderBy: { name: "asc" }
  });

  return NextResponse.json({ categories });
}

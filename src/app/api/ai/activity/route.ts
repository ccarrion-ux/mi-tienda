import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getActiveStoreId } from "@/lib/store-context";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { stores: true } });
  const activeStoreId = await getActiveStoreId(userId);
  const store = user?.stores.find(s => s.id === activeStoreId);
  if (!store) return NextResponse.json({ activities: [] });
  const activities = await prisma.aIActivityLog.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ activities });
}

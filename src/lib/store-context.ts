import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ACTIVE_STORE_COOKIE = "mi_tienda_store_id";

export async function getUserStoreContext(userId: string) {
  const cookieStore = await cookies();
  const requestedId = cookieStore.get(ACTIVE_STORE_COOKIE)?.value;

  const stores = await prisma.store.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true },
  });

  if (!stores.length) return { stores: [], store: null };

  const store = stores.find(s => s.id === requestedId) || stores.at(0) || null;
  return { stores, store };
}

export async function getActiveStoreId(userId: string) {
  const cookieStore = await cookies();
  const requestedId = cookieStore.get(ACTIVE_STORE_COOKIE)?.value;
  const owned = await prisma.store.findFirst({ where: { id: requestedId || "", ownerId: userId, status: "ACTIVE" }, select: { id: true } });
  if (owned) return owned.id;
  const first = await prisma.store.findFirst({ where: { ownerId: userId, status: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { id: true } });
  return first?.id ?? null;
}

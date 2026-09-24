import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getUserStoreContext } from "@/lib/store-context";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const context = await getUserStoreContext(userId);
  return NextResponse.json(context);
}

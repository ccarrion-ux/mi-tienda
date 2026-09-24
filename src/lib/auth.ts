import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const rawSecret = process.env.AUTH_SECRET || "development-secret-change-me";
if (process.env.NODE_ENV === "production" && rawSecret === "development-secret-change-me") {
  throw new Error("AUTH_SECRET debe configurarse en producción.");
}
const secret = new TextEncoder().encode(rawSecret);

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("mi_tienda_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mi_tienda_session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const { prisma } = await import('@/lib/prisma');
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("mi_tienda_session");
}
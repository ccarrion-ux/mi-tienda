import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function getPlatformAdmin() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (allowlist.includes(user.email.toLowerCase())) return { user, role: "OWNER" as const };
  const admin = await prisma.platformAdmin.findUnique({ where: { userId } });
  if (!admin || admin.status !== "ACTIVE") return null;
  return { user, role: admin.role };
}

export async function isPlatformAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (allowlist.includes(user.email.toLowerCase())) return true;
  const admin = await prisma.platformAdmin.findUnique({ where: { userId } });
  return !!admin && admin.status === "ACTIVE";
}

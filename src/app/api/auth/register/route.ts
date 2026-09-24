import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  const key = clientKey(request, "unknown");
  const limit = rateLimit(`register:${key}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Demasiados registros desde esta conexión. Intenta nuevamente más tarde." }, { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } });
  }
  try {
    const { name, email, password, storeName } = await request.json();

    if (!name || !email || !password || !storeName) {
      return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      return NextResponse.json({ error: "Ese correo ya está registrado." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const baseSlug = slugify(storeName) || "mi-tienda";
    let slug = baseSlug;
    let n = 2;

    while (await prisma.store.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`;
    }

    const starter = await prisma.saaSPlan.findUnique({ where: { code: "STARTER" } });
    if (!starter) {
      return NextResponse.json({ error: "Los planes de Mi Tienda aún no están configurados." }, { status: 500 });
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        stores: {
          create: {
            name: String(storeName).trim(),
            slug,
            subscription: {
              create: {
                planId: starter.id,
                status: "TRIALING",
                billingInterval: "MONTHLY",
                trialStartAt: now,
                trialEndAt: trialEnd,
                currentPeriodStart: now,
                currentPeriodEnd: trialEnd,
              }
            }
          }
        }
      }
    });

    await createSession(user.id);

    return NextResponse.json({ ok: true, trialDays: 30 });
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
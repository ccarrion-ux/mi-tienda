import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {
    database: "unknown",
    authSecret: "missing",
    appUrl: "missing",
    flowSaaS: "not-configured",
    email: "not-configured",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET !== "development-secret-change-me") checks.authSecret = "ok";
  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") || process.env.NODE_ENV !== "production") checks.appUrl = "ok";
  if (process.env.FLOW_API_KEY && process.env.FLOW_SECRET_KEY) checks.flowSaaS = "configured";
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) checks.email = "configured";

  const ok = checks.database === "ok" && checks.authSecret === "ok" && checks.appUrl === "ok";
  return NextResponse.json(
    { ok, environment: process.env.NODE_ENV || "development", checks, timestamp: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.saaSPlan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ plans });
}

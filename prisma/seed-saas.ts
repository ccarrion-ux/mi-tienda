import { PrismaClient, PlanCode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    { code: PlanCode.FREE, name: "Free", description: "Para comenzar", monthlyPrice: 0, yearlyPrice: 0, maxProducts: 10, maxUsers: 1, aiCatalog: false, aiMarketing: false, advancedAnalytics: false, customDomain: false, sortOrder: 0 },
    { code: PlanCode.STARTER, name: "Inicial", description: "Para emprendedores", monthlyPrice: 5990, yearlyPrice: 59900, maxProducts: 50, maxUsers: 1, aiCatalog: true, aiMarketing: false, advancedAnalytics: false, customDomain: false, sortOrder: 1 },
    { code: PlanCode.GROWTH, name: "Crecimiento", description: "Para negocios en crecimiento", monthlyPrice: 19990, yearlyPrice: 199900, maxProducts: 500, maxUsers: 3, aiCatalog: true, aiMarketing: true, advancedAnalytics: true, customDomain: true, sortOrder: 2 },
    { code: PlanCode.PRO, name: "Pro", description: "Para tiendas de mayor volumen", monthlyPrice: 28990, yearlyPrice: 289900, maxProducts: null as number | null, maxUsers: 10, aiCatalog: true, aiMarketing: true, advancedAnalytics: true, customDomain: true, sortOrder: 3 },
    { code: PlanCode.ENTERPRISE, name: "Enterprise", description: "Para empresas con necesidades avanzadas", monthlyPrice: 0, yearlyPrice: 0, maxProducts: null as number | null, maxUsers: null, aiCatalog: true, aiMarketing: true, advancedAnalytics: true, customDomain: true, sortOrder: 4 },
  ];

  for (const plan of plans) {
    await prisma.saaSPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }
}

main().finally(() => prisma.$disconnect());

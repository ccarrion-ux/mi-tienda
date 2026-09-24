import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { flowSaaSPost } from "@/lib/flow-saas";
import { getActiveStoreId } from "@/lib/store-context";
export async function POST() {
  const userId = await getSessionUserId(); const activeStoreId = await getActiveStoreId(userId || ""); if (!userId) return NextResponse.json({error:"No autorizado"},{status:401});
  const store = await prisma.store.findFirst({where:{id:activeStoreId},include:{subscription:true}}); if(!store?.subscription)return NextResponse.json({error:"Suscripción no encontrada"},{status:404});
  if(store.subscription.externalSubscriptionId) await flowSaaSPost("/subscription/cancel",{subscriptionId:store.subscription.externalSubscriptionId,at_period_end:1});
  const updated=await prisma.subscription.update({where:{storeId:store.id},data:{cancelAtPeriodEnd:true}});
  return NextResponse.json(updated);
}

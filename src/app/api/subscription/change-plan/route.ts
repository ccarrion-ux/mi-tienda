import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { flowSaaSPost, flowPlanId } from "@/lib/flow-saas";
import { getActiveStoreId } from "@/lib/store-context";
export async function POST(req:Request){
 const userId=await getSessionUserId(); const activeStoreId=await getActiveStoreId(userId || ""); if(!userId)return NextResponse.json({error:"No autorizado"},{status:401});
 const body=await req.json().catch(()=>({})); const code=String(body.planCode||"").toUpperCase(); const interval=body.billingInterval==="YEARLY"?"YEARLY":"MONTHLY";
 const store=await prisma.store.findFirst({where:{id:activeStoreId},include:{subscription:true}}); if(!store?.subscription)return NextResponse.json({error:"Suscripción no encontrada"},{status:404});
 const plan=await prisma.saaSPlan.findUnique({where:{code:code as any}}); if(!plan||!plan.active)return NextResponse.json({error:"Plan no disponible"},{status:400});
 if(store.subscription.externalSubscriptionId){
   const newPlan=flowPlanId(code,interval); await flowSaaSPost("/subscription/changePlan",{subscriptionId:store.subscription.externalSubscriptionId,newPlanId:newPlan});
 }
 const updated=await prisma.subscription.update({where:{storeId:store.id},data:{planId:plan.id,billingInterval:interval as any,cancelAtPeriodEnd:false},include:{plan:true}});
 return NextResponse.json(updated);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { flowSaaSGet } from "@/lib/flow-saas";
export async function GET(req:Request){
 const auth=req.headers.get("authorization"); if(!process.env.CRON_SECRET||auth!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:"No autorizado"},{status:401});
 const subs=await prisma.subscription.findMany({where:{externalSubscriptionId:{not:null}},include:{plan:true}}); let synced=0;
 for(const sub of subs){try{const remote=await flowSaaSGet("/subscription/get",{subscriptionId:sub.externalSubscriptionId!}); const remoteStatus=String(remote.status||"").toLowerCase(); const nextStatus=remoteStatus.includes("cancel")?"CANCELLED":(sub.status==="CANCELLED"?"CANCELLED":(sub.status==="TRIALING"?"TRIALING":"ACTIVE")); const start=remote.period_start?new Date(remote.period_start):sub.currentPeriodStart; const end=remote.period_end?new Date(remote.period_end):sub.currentPeriodEnd; await prisma.subscription.update({where:{id:sub.id},data:{status:nextStatus as any,currentPeriodStart:start,currentPeriodEnd:end,cancelledAt:nextStatus==="CANCELLED"?new Date():sub.cancelledAt}}); synced++;}catch{/* una cuenta no debe detener el lote */}}
 return NextResponse.json({ok:true,synced,total:subs.length});
}

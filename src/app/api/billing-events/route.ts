import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {getSessionUserId} from '@/lib/auth';
import { getActiveStoreId } from "@/lib/store-context";
export async function GET(){const userId=await getSessionUserId();const activeStoreId=await getActiveStoreId(userId || "");if(!userId)return NextResponse.json({error:'No autorizado'},{status:401});const store=await prisma.store.findFirst({where:{id:activeStoreId},include:{subscription:{include:{billingEvents:{orderBy:{periodEnd:'desc'},take:50}}}}});if(!store)return NextResponse.json({error:'Tienda no encontrada'},{status:404});return NextResponse.json({events:store.subscription?.billingEvents||[]})}

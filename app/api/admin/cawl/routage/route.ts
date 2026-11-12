import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'
import { activeCawlProcessor } from '@/lib/cawl-routing'
import { cawlConfigure, testerConnexionCawl } from '@/lib/cawl'
export const dynamic = 'force-dynamic'
// Diagnostic privé, GET bancaire uniquement : aucune commande ou transaction.
export async function GET(req: NextRequest) {
  if (!await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET ?? '')) return NextResponse.json({error:'Non autorisé'}, {status:401})
  try {
    const processor = activeCawlProcessor()
    if (!cawlConfigure()) throw new Error('Configuration absente')
    await testerConnexionCawl(processor)
    return NextResponse.json({ok:true,processor,clientProcessor:processor,partnerProcessor:processor,bankConnectionVerified:true}, {headers:{'Cache-Control':'private, no-store'}})
  } catch { return NextResponse.json({ok:false,error:'Connexion bancaire non validée'}, {status:503,headers:{'Cache-Control':'private, no-store'}}) }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, orderCode } = await req.json()

  if (!email || !orderCode) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, customer_name, customer_email, shipping_address')
      .eq('order_number', String(orderCode).toUpperCase())
      .ilike('customer_email', String(email).trim())
      .maybeSingle()

    if (!order) {
      return NextResponse.json(
        { error: 'Aucune commande trouvée avec ces informations. Vérifiez le numéro et l’email utilisés lors de la commande.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      orderCode:    order.order_number,
      status:       order.status,
      createdAt:    order.created_at,
      city:         order.shipping_address?.city ?? null,
      postalCode:   order.shipping_address?.postal_code ?? null,
      customerName: order.customer_name,
    })
  } catch {
    // Supabase pas encore configuré, ou base non accessible — aucune commande réelle n'existe encore sur ce site de démonstration.
    return NextResponse.json(
      { error: 'Le suivi de commande sera actif dès la mise en production du site.' },
      { status: 404 }
    )
  }
}

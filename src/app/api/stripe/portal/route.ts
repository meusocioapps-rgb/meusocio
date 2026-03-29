import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 },
      )
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura encontrada' },
        { status: 404 },
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura`,
    })

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao abrir portal de assinatura' },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { stripe, getOrCreateCustomer } from '@/lib/stripe'

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

    const customerId = await getOrCreateCustomer(user.email!, user.id)

    // Check if user already had a trial
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('trial_ends_at')
      .eq('user_id', user.id)
      .single()

    const hadTrialBefore = !!subscription?.trial_ends_at

    const sessionParams: Record<string, unknown> = {
      mode: 'subscription' as const,
      customer: customerId,
      customer_email: undefined, // customer already set
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?canceled=true`,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
        ...(!hadTrialBefore ? { trial_period_days: 7 } : {}),
      },
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0],
    )

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json(
      { error: 'Erro ao criar sessao de checkout' },
      { status: 500 },
    )
  }
}

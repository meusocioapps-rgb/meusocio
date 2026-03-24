import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getStripeInstance() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function getSubscriptionDates(sub: Record<string, unknown>) {
  const trialEnd = sub.trial_end
    ? new Date((sub.trial_end as number) * 1000).toISOString()
    : null
  const periodEnd = sub.current_period_end
    ? new Date((sub.current_period_end as number) * 1000).toISOString()
    : null
  return { trialEnd, periodEnd }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
    }

    const stripe = getStripeInstance()
    const supabaseAdmin = getSupabaseAdmin()

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const obj = event.data.object as unknown as Record<string, unknown>

    switch (event.type) {
      case 'checkout.session.completed': {
        const userId = (obj.metadata as Record<string, string>)?.user_id
        if (!userId) break

        const sub = await stripe.subscriptions.retrieve(obj.subscription as string)
        const { trialEnd, periodEnd } = getSubscriptionDates(sub as unknown as Record<string, unknown>)

        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          status: 'active',
          plan: 'pro',
          price: 39.9,
          stripe_customer_id: obj.customer as string,
          stripe_subscription_id: obj.subscription as string,
          trial_ends_at: trialEnd,
          paid_until: periodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        break
      }

      case 'invoice.payment_succeeded': {
        const subscriptionId = obj.subscription as string
        if (!subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const subObj = sub as unknown as Record<string, unknown>
        const userId = (subObj.metadata as Record<string, string>)?.user_id
        if (!userId) break

        const { periodEnd } = getSubscriptionDates(subObj)
        await supabaseAdmin.from('subscriptions').update({
          status: 'active',
          paid_until: periodEnd,
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId)
        break
      }

      case 'invoice.payment_failed': {
        const subscriptionId = obj.subscription as string
        if (!subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = ((sub as unknown as Record<string, unknown>).metadata as Record<string, string>)?.user_id
        if (!userId) break

        await supabaseAdmin.from('subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId)
        break
      }

      case 'customer.subscription.deleted': {
        const userId = (obj.metadata as Record<string, string>)?.user_id
        if (!userId) break

        await supabaseAdmin.from('subscriptions').update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId)
        break
      }

      case 'customer.subscription.updated': {
        const userId = (obj.metadata as Record<string, string>)?.user_id
        if (!userId) break

        const { periodEnd } = getSubscriptionDates(obj)
        await supabaseAdmin.from('subscriptions').update({
          paid_until: periodEnd,
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

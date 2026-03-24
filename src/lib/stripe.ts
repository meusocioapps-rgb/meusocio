import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization - only create when actually needed (not at build time)
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

// For backwards compat
export const stripe = {
  get customers() { return getStripe().customers },
  get checkout() { return getStripe().checkout },
  get subscriptions() { return getStripe().subscriptions },
  get billingPortal() { return getStripe().billingPortal },
  get webhooks() { return getStripe().webhooks },
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * Looks up an existing Stripe customer by user_id in the subscriptions table,
 * or creates a new one and stores the ID.
 */
export async function getOrCreateCustomer(
  email: string,
  userId: string,
): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id
  }

  const customer = await getStripe().customers.create({
    email,
    metadata: { user_id: userId },
  })

  await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  return customer.id
}

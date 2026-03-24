-- =====================================================
-- ADD STRIPE COLUMNS TO SUBSCRIPTIONS TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Admin can read all subscriptions
DROP POLICY IF EXISTS "admin_read_all_subscriptions" ON subscriptions;
CREATE POLICY "admin_read_all_subscriptions" ON subscriptions
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- Admin can update subscriptions
DROP POLICY IF EXISTS "admin_update_subscriptions" ON subscriptions;
CREATE POLICY "admin_update_subscriptions" ON subscriptions
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- =====================================================
-- ADMIN RLS POLICIES — allow admin to read ALL tables
-- Admin email: meusocio.apps@gmail.com
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. PROFILES (already done, but ensure it exists)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com'
  );

-- Admin can UPDATE profiles (to edit user data)
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- Admin can DELETE profiles
DROP POLICY IF EXISTS "admin_delete_profiles" ON profiles;
CREATE POLICY "admin_delete_profiles" ON profiles
  FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- 2. SERVICES — admin can read all
DROP POLICY IF EXISTS "admin_read_all_services" ON services;
CREATE POLICY "admin_read_all_services" ON services
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- 3. CLIENTS — admin can read all
DROP POLICY IF EXISTS "admin_read_all_clients" ON clients;
CREATE POLICY "admin_read_all_clients" ON clients
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- 4. APPOINTMENTS — admin can read all
DROP POLICY IF EXISTS "admin_read_all_appointments" ON appointments;
CREATE POLICY "admin_read_all_appointments" ON appointments
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- 5. FINANCIAL_ENTRIES — admin can read all
DROP POLICY IF EXISTS "admin_read_all_financial_entries" ON financial_entries;
CREATE POLICY "admin_read_all_financial_entries" ON financial_entries
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- 6. FIXED_EXPENSES — admin can read all
DROP POLICY IF EXISTS "admin_read_all_fixed_expenses" ON fixed_expenses;
CREATE POLICY "admin_read_all_fixed_expenses" ON fixed_expenses
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- 7. SETTINGS — admin can read all
DROP POLICY IF EXISTS "admin_read_all_settings" ON settings;
CREATE POLICY "admin_read_all_settings" ON settings
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- 8. FEEDBACK — admin policies (already exist from create_feedback_table.sql)
-- Just ensure they exist
DROP POLICY IF EXISTS "admin_can_view_all_feedback" ON feedback;
CREATE POLICY "admin_can_view_all_feedback" ON feedback
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

DROP POLICY IF EXISTS "admin_can_update_feedback" ON feedback;
CREATE POLICY "admin_can_update_feedback" ON feedback
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

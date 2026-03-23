-- =====================================================
-- ADMIN RLS POLICY — allow admin to read all profiles
-- Admin email: meusocio.apps@gmail.com
-- =====================================================

DO $$
BEGIN
  -- Drop any existing select policies on profiles
  DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
  DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
END $$;

-- Recreate: users see own profile, admin (by email) sees all
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com'
  );

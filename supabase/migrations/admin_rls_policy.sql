-- =====================================================
-- ADMIN RLS POLICY — allow admin to read all profiles
-- Admin user ID: 6a4f402a-d589-4079-a1d3-5d37264f9659
-- =====================================================

DO $$
BEGIN
  -- Drop existing select policy if any
  DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
END $$;

-- Recreate: users see own profile, admin sees all
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR auth.uid() = '6a4f402a-d589-4079-a1d3-5d37264f9659'::uuid
  );

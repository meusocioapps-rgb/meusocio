-- =====================================================
-- FIX: Recriar trigger handle_new_user
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- =====================================================

-- 1. Dropar trigger existente (se houver)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Dropar e recriar a funcao com tratamento de erro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir profile (ignora se ja existir)
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- Inserir settings (ignora se ja existir)
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Inserir subscription (ignora se ja existir)
  INSERT INTO public.subscriptions (user_id, trial_ends_at)
  VALUES (NEW.id, now() + INTERVAL '7 days')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas nao bloqueia o cadastro
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Garantir que a funcao tem permissao
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.profiles TO supabase_auth_admin;
GRANT ALL ON public.settings TO supabase_auth_admin;
GRANT ALL ON public.subscriptions TO supabase_auth_admin;

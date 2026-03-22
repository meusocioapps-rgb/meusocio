-- =====================================================
-- MEU SOCIO — SCHEMA COMPLETO PARA SUPABASE
-- Versao: 1.0
-- Pronto para colar no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- EXTENSOES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TIPOS ENUM
-- =====================================================
CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'completed',
  'rescheduled',
  'no_show',
  'cancelled'
);

CREATE TYPE entry_type AS ENUM ('income', 'expense');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'partial');
CREATE TYPE expense_category AS ENUM ('variable', 'fixed', 'cmv', 'daily_cost');

-- =====================================================
-- 1. PROFILES (estende auth.users)
-- =====================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  business_name TEXT NOT NULL DEFAULT 'Meu Negócio',
  trade         TEXT DEFAULT 'MEI',
  document      TEXT,
  phone         TEXT,
  email         TEXT,
  instagram     TEXT,
  website       TEXT,
  address       TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Perfil do profissional/negocio. 1:1 com auth.users';

-- =====================================================
-- 2. SETTINGS (configuracoes por usuario)
-- =====================================================
CREATE TABLE settings (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reactivation_days      INT NOT NULL DEFAULT 30,
  recurrence_min_visits  INT NOT NULL DEFAULT 3,
  monthly_goal           NUMERIC(10,2) DEFAULT 0,
  notify_birthday        BOOLEAN NOT NULL DEFAULT true,
  notify_das             BOOLEAN NOT NULL DEFAULT true,
  notify_inactive        BOOLEAN NOT NULL DEFAULT true,
  notify_fixed_expenses  BOOLEAN NOT NULL DEFAULT true,
  daily_cost_enabled     BOOLEAN NOT NULL DEFAULT false,
  daily_cost_value       NUMERIC(10,2) DEFAULT 0,
  show_upsell_field      BOOLEAN NOT NULL DEFAULT true,
  show_deposit_field     BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE settings IS 'Configuracoes personalizaveis por usuario';

-- =====================================================
-- 3. SERVICES (servicos oferecidos)
-- =====================================================
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration    TEXT,
  cost        NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_service_name_user UNIQUE(user_id, name)
);

CREATE INDEX idx_services_user ON services(user_id) WHERE is_active = true;

COMMENT ON TABLE services IS 'Catalogo de servicos do profissional com CMV';

-- =====================================================
-- 4. CLIENTS (clientes do profissional)
-- =====================================================
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  instagram   TEXT,
  birth_date  DATE,
  source      TEXT DEFAULT 'Indicação',
  notes       TEXT,
  custom_data JSONB DEFAULT '{}',
  is_removed_from_reactivation BOOLEAN NOT NULL DEFAULT false,
  is_removed_from_recurrence   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_clients_code ON clients(user_id, code);
CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_name ON clients(user_id, name);
CREATE INDEX idx_clients_birth ON clients(user_id, birth_date)
  WHERE birth_date IS NOT NULL;

COMMENT ON TABLE clients IS 'CRM simplificado — cadastro de clientes do profissional';

-- =====================================================
-- 5. APPOINTMENTS (agendamentos)
-- =====================================================
CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name    TEXT NOT NULL,
  scheduled_date  DATE NOT NULL,
  scheduled_time  TIME NOT NULL,
  estimated_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_value     NUMERIC(10,2),
  status          appointment_status NOT NULL DEFAULT 'scheduled',
  is_free_return  BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT,
  upsell_service  TEXT,
  upsell_value    NUMERIC(10,2) DEFAULT 0,
  next_return     DATE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_user_date ON appointments(user_id, scheduled_date);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(user_id, status)
  WHERE status IN ('scheduled', 'confirmed');
CREATE INDEX idx_appointments_completed_month ON appointments(user_id, scheduled_date)
  WHERE status = 'completed';

COMMENT ON TABLE appointments IS 'Agendamentos — coracao do sistema. Status gera impacto financeiro';

-- =====================================================
-- 6. FINANCIAL_ENTRIES (receitas e despesas)
-- =====================================================
CREATE TABLE financial_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             entry_type NOT NULL,
  amount           NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  description      TEXT NOT NULL,
  entry_date       DATE NOT NULL,
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name      TEXT,
  service_name     TEXT,
  appointment_id   UUID REFERENCES appointments(id) ON DELETE SET NULL,
  status           payment_status DEFAULT 'paid',
  expense_category expense_category,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_user_date ON financial_entries(user_id, entry_date);
CREATE INDEX idx_financial_user_type_date ON financial_entries(user_id, type, entry_date);
CREATE INDEX idx_financial_pending ON financial_entries(user_id)
  WHERE type = 'income' AND status = 'pending';
CREATE INDEX idx_financial_appointment ON financial_entries(appointment_id)
  WHERE appointment_id IS NOT NULL;

COMMENT ON TABLE financial_entries IS 'Lancamentos financeiros. Receitas geradas automaticamente ao completar atendimento';

-- =====================================================
-- 7. FIXED_EXPENSES (despesas fixas mensais)
-- =====================================================
CREATE TABLE fixed_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  due_day     INT CHECK (due_day BETWEEN 1 AND 31),
  category    TEXT DEFAULT 'Outros',
  notify      BOOLEAN NOT NULL DEFAULT true,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fixed_expenses_user ON fixed_expenses(user_id) WHERE is_active = true;

COMMENT ON TABLE fixed_expenses IS 'Despesas recorrentes (DAS MEI, aluguel, etc)';

-- =====================================================
-- 8. CLIENT_HISTORY (historico de atendimentos)
-- =====================================================
CREATE TABLE client_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,
  event_date      DATE NOT NULL,
  service_name    TEXT,
  value           NUMERIC(10,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_client ON client_history(client_id);
CREATE INDEX idx_history_user_date ON client_history(user_id, event_date);

COMMENT ON TABLE client_history IS 'Log de eventos do cliente. Imutavel — so INSERT';

-- =====================================================
-- 9. CUSTOM_FIELDS (campos personalizados)
-- =====================================================
CREATE TABLE custom_fields (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  field_type  TEXT NOT NULL DEFAULT 'texto',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_fields_user ON custom_fields(user_id) WHERE is_active = true;

COMMENT ON TABLE custom_fields IS 'Definicao de campos extras na ficha do cliente';

-- =====================================================
-- 10. SUBSCRIPTIONS (assinaturas do SaaS)
-- =====================================================
CREATE TABLE subscriptions (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan               TEXT NOT NULL DEFAULT 'trial',
  status             TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at      TIMESTAMPTZ,
  paid_until         TIMESTAMPTZ,
  mp_subscription_id TEXT,
  mp_customer_id     TEXT,
  price              NUMERIC(10,2) DEFAULT 39.90,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE subscriptions IS 'Controle de assinatura do profissional no SaaS';

-- =====================================================
-- 11. NOTIFICATION_LOG (log de notificacoes enviadas)
-- =====================================================
CREATE TABLE notification_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  channel      TEXT NOT NULL DEFAULT 'whatsapp',
  message_type TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'sent',
  external_id  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_user ON notification_log(user_id, created_at);

-- =====================================================
-- TRIGGER: auto-criar profile + settings ao registrar
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO settings (user_id)
  VALUES (NEW.id);

  INSERT INTO subscriptions (user_id, trial_ends_at)
  VALUES (NEW.id, now() + INTERVAL '7 days');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- TRIGGER: auto-preencher user_id em toda tabela
-- =====================================================
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_user_id_services BEFORE INSERT ON services
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER trg_set_user_id_clients BEFORE INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER trg_set_user_id_appointments BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER trg_set_user_id_financial BEFORE INSERT ON financial_entries
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER trg_set_user_id_fixed_expenses BEFORE INSERT ON fixed_expenses
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER trg_set_user_id_history BEFORE INSERT ON client_history
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER trg_set_user_id_custom_fields BEFORE INSERT ON custom_fields
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER trg_set_user_id_notification BEFORE INSERT ON notification_log
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- =====================================================
-- TRIGGER: updated_at automatico
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_profiles BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_settings BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_clients BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_appointments BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_updated_subscriptions BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- TRIGGER: gerar code sequencial para clientes
-- =====================================================
CREATE OR REPLACE FUNCTION generate_client_code()
RETURNS TRIGGER AS $$
DECLARE
  v_next INT;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    SELECT COALESCE(
      MAX(NULLIF(regexp_replace(code, '[^0-9]', '', 'g'), '')::INT), 0
    ) + 1
    INTO v_next
    FROM clients
    WHERE user_id = NEW.user_id;

    NEW.code := '#' || LPAD(v_next::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_client_code BEFORE INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION generate_client_code();

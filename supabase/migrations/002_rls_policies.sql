-- =====================================================
-- MEU SOCIO — ROW LEVEL SECURITY + POLICIES
-- Executar APOS 001_schema.sql
-- =====================================================

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES (chave = id, nao user_id)
-- =====================================================
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT e feito pelo trigger handle_new_user (SECURITY DEFINER)
-- DELETE nao permitido via app

-- =====================================================
-- SETTINGS (chave = user_id)
-- =====================================================
CREATE POLICY "settings_select_own"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "settings_insert_own"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "settings_update_own"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SUBSCRIPTIONS (chave = user_id)
-- =====================================================
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE feito por triggers e Edge Functions (SECURITY DEFINER)

-- =====================================================
-- MACRO: policies CRUD padrao para tabelas com user_id
-- Aplicado em: services, clients, appointments,
-- financial_entries, fixed_expenses, client_history,
-- custom_fields, notification_log
-- =====================================================

-- SERVICES
CREATE POLICY "services_select_own"
  ON services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "services_insert_own"
  ON services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "services_update_own"
  ON services FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "services_delete_own"
  ON services FOR DELETE USING (auth.uid() = user_id);

-- CLIENTS
CREATE POLICY "clients_select_own"
  ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_insert_own"
  ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_update_own"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_delete_own"
  ON clients FOR DELETE USING (auth.uid() = user_id);

-- APPOINTMENTS
CREATE POLICY "appointments_select_own"
  ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "appointments_insert_own"
  ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_update_own"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_delete_own"
  ON appointments FOR DELETE USING (auth.uid() = user_id);

-- FINANCIAL_ENTRIES
CREATE POLICY "financial_select_own"
  ON financial_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "financial_insert_own"
  ON financial_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "financial_update_own"
  ON financial_entries FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "financial_delete_own"
  ON financial_entries FOR DELETE USING (auth.uid() = user_id);

-- FIXED_EXPENSES
CREATE POLICY "fixed_expenses_select_own"
  ON fixed_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fixed_expenses_insert_own"
  ON fixed_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fixed_expenses_update_own"
  ON fixed_expenses FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fixed_expenses_delete_own"
  ON fixed_expenses FOR DELETE USING (auth.uid() = user_id);

-- CLIENT_HISTORY (somente leitura + insert — historico e imutavel)
CREATE POLICY "history_select_own"
  ON client_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "history_insert_own"
  ON client_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CUSTOM_FIELDS
CREATE POLICY "custom_fields_select_own"
  ON custom_fields FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "custom_fields_insert_own"
  ON custom_fields FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "custom_fields_update_own"
  ON custom_fields FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "custom_fields_delete_own"
  ON custom_fields FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATION_LOG (somente leitura — insert via Edge Functions)
CREATE POLICY "notification_select_own"
  ON notification_log FOR SELECT USING (auth.uid() = user_id);

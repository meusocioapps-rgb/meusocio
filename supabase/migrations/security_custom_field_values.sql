-- Tabela para valores de campos personalizados por cliente
-- Referenciada em clients/[id]/page.tsx mas nao existia em migrations

CREATE TABLE IF NOT EXISTS client_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, custom_field_id)
);

-- RLS obrigatorio
ALTER TABLE client_custom_field_values ENABLE ROW LEVEL SECURITY;

-- Policy: usuario so acessa valores dos seus proprios clientes
CREATE POLICY "user_own_field_values_select" ON client_custom_field_values
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = client_id AND c.user_id = auth.uid())
  );

CREATE POLICY "user_own_field_values_insert" ON client_custom_field_values
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = client_id AND c.user_id = auth.uid())
  );

CREATE POLICY "user_own_field_values_update" ON client_custom_field_values
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = client_id AND c.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = client_id AND c.user_id = auth.uid())
  );

CREATE POLICY "user_own_field_values_delete" ON client_custom_field_values
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = client_id AND c.user_id = auth.uid())
  );

-- Admin access
CREATE POLICY "admin_field_values_select" ON client_custom_field_values
  FOR SELECT USING ((auth.jwt() ->> 'email') = current_setting('app.admin_email', true));

CREATE POLICY "admin_field_values_all" ON client_custom_field_values
  FOR ALL USING ((auth.jwt() ->> 'email') = current_setting('app.admin_email', true));

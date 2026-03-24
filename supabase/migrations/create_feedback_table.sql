-- ============================================
-- TABELA FEEDBACK
-- Armazena sugestoes, bugs e mensagens dos usuarios
-- ============================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  type TEXT NOT NULL DEFAULT 'sugestao' CHECK (type IN ('sugestao', 'bug', 'outro')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Usuarios podem inserir feedback
CREATE POLICY "users_can_insert_feedback" ON feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios podem ver seus proprios feedbacks
CREATE POLICY "users_can_view_own_feedback" ON feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admin pode ver todos os feedbacks
CREATE POLICY "admin_can_view_all_feedback" ON feedback
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

-- Admin pode atualizar (marcar como lido)
CREATE POLICY "admin_can_update_feedback" ON feedback
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'meusocio.apps@gmail.com');

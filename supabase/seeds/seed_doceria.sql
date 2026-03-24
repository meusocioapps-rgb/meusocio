-- ============================================
-- SEED: Doceria (dgcosta691@gmail.com)
-- Negócio: Doceria - Delivery e Encomendas
-- Gerado: 2026-03-23
-- ============================================
-- Adaptações para doceria:
-- - "Agendamento" funciona como ENCOMENDA (data/hora de entrega ou retirada)
-- - Serviços = produtos e combos
-- - Clientes = clientes que fazem encomendas
-- - Financeiro = vendas e custos de insumos
-- ============================================

DO $$
DECLARE
  uid UUID;
  s1 UUID; s2 UUID; s3 UUID; s4 UUID; s5 UUID;
  s6 UUID; s7 UUID; s8 UUID; s9 UUID; s10 UUID;
  s11 UUID; s12 UUID;
  c1 UUID; c2 UUID; c3 UUID; c4 UUID; c5 UUID;
  c6 UUID; c7 UUID; c8 UUID; c9 UUID; c10 UUID;
BEGIN
  -- 1. Buscar usuario
  SELECT id INTO uid FROM auth.users WHERE email = 'dgcosta691@gmail.com';
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Usuario nao encontrado: dgcosta691@gmail.com';
  END IF;

  -- 2. Atualizar perfil
  UPDATE profiles SET
    business_name = 'Doceria DG',
    full_name = 'DG Costa'
  WHERE id = uid;

  -- 3. Inserir servicos (produtos e combos da doceria)
  -- Doces individuais
  INSERT INTO services (id, user_id, name, price, duration, cost) VALUES
    (gen_random_uuid(), uid, 'Brigadeiro gourmet (unid)', 4.50, '–', 1.20),
    (gen_random_uuid(), uid, 'Beijinho gourmet (unid)', 4.50, '–', 1.20),
    (gen_random_uuid(), uid, 'Trufa (unid)', 6.00, '–', 2.00),
    (gen_random_uuid(), uid, 'Brownie (unid)', 8.00, '–', 2.50),
    (gen_random_uuid(), uid, 'Palha italiana (unid)', 5.00, '–', 1.50),
    -- Caixas e combos
    (gen_random_uuid(), uid, 'Caixa 25 brigadeiros', 100.00, '1 dia', 28.00),
    (gen_random_uuid(), uid, 'Caixa 50 brigadeiros', 180.00, '2 dias', 52.00),
    (gen_random_uuid(), uid, 'Caixa 100 brigadeiros', 320.00, '3 dias', 95.00),
    (gen_random_uuid(), uid, 'Kit festa (50 doces sortidos)', 200.00, '2 dias', 60.00),
    (gen_random_uuid(), uid, 'Mesa de doces completa', 550.00, '3 dias', 180.00),
    -- Bolos
    (gen_random_uuid(), uid, 'Bolo caseiro simples', 60.00, '1 dia', 18.00),
    (gen_random_uuid(), uid, 'Bolo decorado (aniversario)', 150.00, '2 dias', 45.00)
  ON CONFLICT DO NOTHING;

  -- Pegar IDs dos servicos
  SELECT id INTO s1 FROM services WHERE user_id = uid AND name = 'Brigadeiro gourmet (unid)' LIMIT 1;
  SELECT id INTO s2 FROM services WHERE user_id = uid AND name = 'Caixa 25 brigadeiros' LIMIT 1;
  SELECT id INTO s3 FROM services WHERE user_id = uid AND name = 'Caixa 50 brigadeiros' LIMIT 1;
  SELECT id INTO s4 FROM services WHERE user_id = uid AND name = 'Caixa 100 brigadeiros' LIMIT 1;
  SELECT id INTO s5 FROM services WHERE user_id = uid AND name = 'Kit festa (50 doces sortidos)' LIMIT 1;
  SELECT id INTO s6 FROM services WHERE user_id = uid AND name = 'Mesa de doces completa' LIMIT 1;
  SELECT id INTO s7 FROM services WHERE user_id = uid AND name = 'Bolo caseiro simples' LIMIT 1;
  SELECT id INTO s8 FROM services WHERE user_id = uid AND name = 'Bolo decorado (aniversario)' LIMIT 1;
  SELECT id INTO s9 FROM services WHERE user_id = uid AND name = 'Brownie (unid)' LIMIT 1;
  SELECT id INTO s10 FROM services WHERE user_id = uid AND name = 'Trufa (unid)' LIMIT 1;
  SELECT id INTO s11 FROM services WHERE user_id = uid AND name = 'Palha italiana (unid)' LIMIT 1;
  SELECT id INTO s12 FROM services WHERE user_id = uid AND name = 'Beijinho gourmet (unid)' LIMIT 1;

  -- 4. Inserir clientes
  INSERT INTO clients (id, user_id, name, phone, code) VALUES
    (gen_random_uuid(), uid, 'Ana Paula Souza', '11987654321', 'C001'),
    (gen_random_uuid(), uid, 'Mariana Ferreira', '11976543210', 'C002'),
    (gen_random_uuid(), uid, 'Roberto Lima', '11965432109', 'C003'),
    (gen_random_uuid(), uid, 'Juliana Mendes', '11954321098', 'C004'),
    (gen_random_uuid(), uid, 'Patricia Oliveira', '11943210987', 'C005'),
    (gen_random_uuid(), uid, 'Fernanda Alves', '11932109876', 'C006'),
    (gen_random_uuid(), uid, 'Camila Santos', '11921098765', 'C007'),
    (gen_random_uuid(), uid, 'Luciana Costa', '11910987654', 'C008'),
    (gen_random_uuid(), uid, 'Beatriz Rodrigues', '11999887766', 'C009'),
    (gen_random_uuid(), uid, 'Tatiane Nascimento', '11988776655', 'C010')
  ON CONFLICT DO NOTHING;

  -- Pegar IDs dos clientes
  SELECT id INTO c1 FROM clients WHERE user_id = uid AND code = 'C001' LIMIT 1;
  SELECT id INTO c2 FROM clients WHERE user_id = uid AND code = 'C002' LIMIT 1;
  SELECT id INTO c3 FROM clients WHERE user_id = uid AND code = 'C003' LIMIT 1;
  SELECT id INTO c4 FROM clients WHERE user_id = uid AND code = 'C004' LIMIT 1;
  SELECT id INTO c5 FROM clients WHERE user_id = uid AND code = 'C005' LIMIT 1;
  SELECT id INTO c6 FROM clients WHERE user_id = uid AND code = 'C006' LIMIT 1;
  SELECT id INTO c7 FROM clients WHERE user_id = uid AND code = 'C007' LIMIT 1;
  SELECT id INTO c8 FROM clients WHERE user_id = uid AND code = 'C008' LIMIT 1;
  SELECT id INTO c9 FROM clients WHERE user_id = uid AND code = 'C009' LIMIT 1;
  SELECT id INTO c10 FROM clients WHERE user_id = uid AND code = 'C010' LIMIT 1;

  -- 5. Inserir encomendas (agendamentos)
  -- Encomendas passadas (completadas) - marco 2026
  INSERT INTO appointments (id, user_id, client_id, service_id, scheduled_date, scheduled_time, estimated_value, final_value, status, completed_at) VALUES
    (gen_random_uuid(), uid, c1, s2, '2026-03-05', '14:00', 100.00, 100.00, 'completed', '2026-03-05T14:00:00Z'),
    (gen_random_uuid(), uid, c2, s5, '2026-03-08', '10:00', 200.00, 200.00, 'completed', '2026-03-08T10:00:00Z'),
    (gen_random_uuid(), uid, c3, s7, '2026-03-10', '16:00', 60.00, 60.00, 'completed', '2026-03-10T16:00:00Z'),
    (gen_random_uuid(), uid, c4, s3, '2026-03-12', '11:00', 180.00, 180.00, 'completed', '2026-03-12T11:00:00Z'),
    (gen_random_uuid(), uid, c5, s8, '2026-03-14', '09:00', 150.00, 170.00, 'completed', '2026-03-14T09:00:00Z'),
    (gen_random_uuid(), uid, c6, s2, '2026-03-15', '15:00', 100.00, 100.00, 'completed', '2026-03-15T15:00:00Z'),
    (gen_random_uuid(), uid, c9, s4, '2026-03-17', '10:00', 320.00, 320.00, 'completed', '2026-03-17T10:00:00Z'),
    (gen_random_uuid(), uid, c7, s7, '2026-03-19', '14:00', 60.00, 70.00, 'completed', '2026-03-19T14:00:00Z'),
    (gen_random_uuid(), uid, c10, s3, '2026-03-20', '11:00', 180.00, 180.00, 'completed', '2026-03-20T11:00:00Z'),
    (gen_random_uuid(), uid, c1, s6, '2026-03-21', '09:00', 550.00, 550.00, 'completed', '2026-03-21T09:00:00Z')
  ON CONFLICT DO NOTHING;

  -- Encomendas futuras (agendadas) - proximos dias
  INSERT INTO appointments (id, user_id, client_id, service_id, scheduled_date, scheduled_time, estimated_value, status) VALUES
    (gen_random_uuid(), uid, c2, s8, '2026-03-24', '10:00', 150.00, 'confirmed'),
    (gen_random_uuid(), uid, c8, s5, '2026-03-25', '14:00', 200.00, 'scheduled'),
    (gen_random_uuid(), uid, c4, s2, '2026-03-26', '11:00', 100.00, 'scheduled'),
    (gen_random_uuid(), uid, c3, s6, '2026-03-28', '09:00', 550.00, 'confirmed'),
    (gen_random_uuid(), uid, c6, s4, '2026-03-30', '15:00', 320.00, 'scheduled'),
    -- Abril
    (gen_random_uuid(), uid, c5, s8, '2026-04-02', '10:00', 150.00, 'scheduled'),
    (gen_random_uuid(), uid, c1, s3, '2026-04-05', '14:00', 180.00, 'scheduled'),
    (gen_random_uuid(), uid, c9, s6, '2026-04-10', '09:00', 550.00, 'scheduled'),
    (gen_random_uuid(), uid, c7, s5, '2026-04-12', '11:00', 200.00, 'scheduled')
  ON CONFLICT DO NOTHING;

  -- 6. Entradas financeiras (receitas das encomendas completadas)
  INSERT INTO financial_entries (id, user_id, type, amount, description, entry_date, client_name, service_name, status) VALUES
    (gen_random_uuid(), uid, 'income', 100.00, 'Caixa 25 brigadeiros', '2026-03-05', 'Ana Paula Souza', 'Caixa 25 brigadeiros', 'paid'),
    (gen_random_uuid(), uid, 'income', 200.00, 'Kit festa 50 doces', '2026-03-08', 'Mariana Ferreira', 'Kit festa (50 doces sortidos)', 'paid'),
    (gen_random_uuid(), uid, 'income', 60.00, 'Bolo caseiro', '2026-03-10', 'Roberto Lima', 'Bolo caseiro simples', 'paid'),
    (gen_random_uuid(), uid, 'income', 180.00, 'Caixa 50 brigadeiros', '2026-03-12', 'Juliana Mendes', 'Caixa 50 brigadeiros', 'paid'),
    (gen_random_uuid(), uid, 'income', 170.00, 'Bolo decorado aniversario', '2026-03-14', 'Patricia Oliveira', 'Bolo decorado (aniversario)', 'paid'),
    (gen_random_uuid(), uid, 'income', 100.00, 'Caixa 25 brigadeiros', '2026-03-15', 'Fernanda Alves', 'Caixa 25 brigadeiros', 'paid'),
    (gen_random_uuid(), uid, 'income', 320.00, 'Caixa 100 brigadeiros', '2026-03-17', 'Beatriz Rodrigues', 'Caixa 100 brigadeiros', 'paid'),
    (gen_random_uuid(), uid, 'income', 70.00, 'Bolo caseiro + cobertura', '2026-03-19', 'Camila Santos', 'Bolo caseiro simples', 'paid'),
    (gen_random_uuid(), uid, 'income', 180.00, 'Caixa 50 brigadeiros', '2026-03-20', 'Tatiane Nascimento', 'Caixa 50 brigadeiros', 'paid'),
    (gen_random_uuid(), uid, 'income', 550.00, 'Mesa de doces completa', '2026-03-21', 'Ana Paula Souza', 'Mesa de doces completa', 'paid')
  ON CONFLICT DO NOTHING;

  -- Despesas variaveis (insumos)
  INSERT INTO financial_entries (id, user_id, type, amount, description, entry_date, expense_category, status) VALUES
    (gen_random_uuid(), uid, 'expense', 185.00, 'Chocolate granulado e leite condensado', '2026-03-03', 'cmv', 'paid'),
    (gen_random_uuid(), uid, 'expense', 120.00, 'Embalagens e caixas', '2026-03-05', 'cmv', 'paid'),
    (gen_random_uuid(), uid, 'expense', 95.00, 'Manteiga, creme de leite, açucar', '2026-03-10', 'cmv', 'paid'),
    (gen_random_uuid(), uid, 'expense', 78.00, 'Farinha, ovos, fermento', '2026-03-14', 'cmv', 'paid'),
    (gen_random_uuid(), uid, 'expense', 150.00, 'Reposicao chocolate e leite condensado', '2026-03-18', 'cmv', 'paid'),
    (gen_random_uuid(), uid, 'expense', 45.00, 'Gas de cozinha', '2026-03-02', 'variable', 'paid'),
    (gen_random_uuid(), uid, 'expense', 60.00, 'Delivery (combustivel)', '2026-03-15', 'variable', 'paid')
  ON CONFLICT DO NOTHING;

  -- 7. Despesas fixas mensais
  INSERT INTO fixed_expenses (id, user_id, description, amount, due_day, category, is_active) VALUES
    (gen_random_uuid(), uid, 'Aluguel cozinha/espaco', 600.00, 5, 'fixed', true),
    (gen_random_uuid(), uid, 'Conta de luz', 180.00, 10, 'fixed', true),
    (gen_random_uuid(), uid, 'Conta de agua', 65.00, 15, 'fixed', true),
    (gen_random_uuid(), uid, 'Internet', 99.90, 12, 'fixed', true),
    (gen_random_uuid(), uid, 'DAS MEI', 75.90, 20, 'fixed', true),
    (gen_random_uuid(), uid, 'Embalagens mensais', 150.00, 1, 'cmv', true),
    (gen_random_uuid(), uid, 'Seguro', 45.00, 25, 'fixed', true)
  ON CONFLICT DO NOTHING;

  -- 8. Configurações
  INSERT INTO settings (user_id, monthly_goal, reactivation_days, recurrence_min_visits)
  VALUES (uid, 3500, 45, 3)
  ON CONFLICT (user_id) DO UPDATE SET
    monthly_goal = 3500,
    reactivation_days = 45,
    recurrence_min_visits = 3;

  -- 9. Historico de clientes (marcar recorrentes)
  UPDATE clients SET
    total_visits = 3,
    is_recurrent = true,
    last_visit = '2026-03-21'
  WHERE id = c1 AND user_id = uid;

  UPDATE clients SET
    total_visits = 2,
    is_recurrent = false,
    last_visit = '2026-03-08'
  WHERE id = c2 AND user_id = uid;

  UPDATE clients SET
    total_visits = 2,
    is_recurrent = false,
    last_visit = '2026-03-10'
  WHERE id = c3 AND user_id = uid;

  UPDATE clients SET
    total_visits = 1,
    is_recurrent = false,
    last_visit = '2026-03-12'
  WHERE id = c4 AND user_id = uid;

  UPDATE clients SET
    total_visits = 1,
    is_recurrent = false,
    last_visit = '2026-03-14'
  WHERE id = c5 AND user_id = uid;

  RAISE NOTICE 'Seed doceria DG concluido com sucesso!';
END $$;

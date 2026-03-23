-- =====================================================
-- SEED: Dados para usuario "Marido de Aluguel"
-- Substitua 'UUID_AQUI' pelo ID real do usuario
-- Rode no SQL Editor do Supabase
-- =====================================================

-- Variavel com o UUID do usuario
-- IMPORTANTE: Substitua pelo UUID real retornado pela query:
-- SELECT id FROM auth.users WHERE email = 'sabidao19@gmail.com';
DO $$
DECLARE
  v_uid UUID;
  v_c1 UUID; v_c2 UUID; v_c3 UUID; v_c4 UUID; v_c5 UUID;
  v_c6 UUID; v_c7 UUID; v_c8 UUID;
BEGIN
  -- Buscar o usuario pelo email
  SELECT id INTO v_uid FROM auth.users WHERE email = 'sabidao19@gmail.com';

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario com email sabidao19@gmail.com nao encontrado!';
  END IF;

  RAISE NOTICE 'Usuario encontrado: %', v_uid;

  -- =====================================================
  -- 1. ATUALIZAR PERFIL
  -- =====================================================
  UPDATE profiles SET
    full_name = 'Sabidao',
    business_name = 'Sabidao - Marido de Aluguel',
    trade = 'Servicos Gerais / Marido de Aluguel',
    phone = '(11) 99999-0000',
    instagram = '@sabidao.maridodealuguel',
    updated_at = now()
  WHERE id = v_uid;

  -- =====================================================
  -- 2. ATUALIZAR CONFIGURACOES
  -- =====================================================
  UPDATE settings SET
    monthly_goal = 8000,
    reactivation_days = 30,
    recurrence_min_visits = 3,
    notify_birthday = true,
    notify_inactive = true,
    notify_fixed_expenses = true,
    updated_at = now()
  WHERE user_id = v_uid;

  -- =====================================================
  -- 3. CRIAR SERVICOS (Marido de Aluguel)
  -- =====================================================
  -- Limpar servicos existentes primeiro
  DELETE FROM services WHERE user_id = v_uid;

  INSERT INTO services (user_id, name, price, duration, cost, is_active) VALUES
    (v_uid, 'Instalacao eletrica',        180, '2h',   35, true),
    (v_uid, 'Reparo hidraulico',          150, '1h30', 40, true),
    (v_uid, 'Montagem de moveis',         120, '2h',   15, true),
    (v_uid, 'Pintura (diaria)',           350, '8h',   80, true),
    (v_uid, 'Troca de torneira/chuveiro', 100, '45min',30, true),
    (v_uid, 'Instalacao de ventilador',    90, '40min',10, true),
    (v_uid, 'Fixacao (TV, prateleira)',   130, '1h',   25, true),
    (v_uid, 'Desentupimento',            200, '1h30', 50, true),
    (v_uid, 'Reparo em porta/janela',    160, '1h30', 35, true),
    (v_uid, 'Instalacao de luminaria',     80, '30min',12, true),
    (v_uid, 'Manutencao geral',          250, '3h',   45, true),
    (v_uid, 'Troca de fechadura',        120, '1h',   40, true),
    (v_uid, 'Instalacao de suporte TV',  150, '1h',   35, true),
    (v_uid, 'Reparo em gesso/drywall',   200, '2h',   60, true),
    (v_uid, 'Visita tecnica/orcamento',    0, '30min',  0, true);

  -- =====================================================
  -- 4. CRIAR CLIENTES DE EXEMPLO
  -- =====================================================
  DELETE FROM clients WHERE user_id = v_uid;

  INSERT INTO clients (id, user_id, code, name, phone, email, instagram, birth_date, source, notes) VALUES
    (gen_random_uuid(), v_uid, '#00001', 'Maria Oliveira',     '(11) 98765-4321', 'maria.oli@gmail.com',   '@maria.oli',   '1985-06-15', 'Indicacao', 'Apartamento 3 quartos, Moema. Cliente fiel.')
    RETURNING id INTO v_c1;
  INSERT INTO clients (id, user_id, code, name, phone, email, birth_date, source, notes) VALUES
    (gen_random_uuid(), v_uid, '#00002', 'Carlos Barbeiro',    '(11) 97654-3210', 'carlos.b@hotmail.com',  '1978-03-22', 'Google', 'Casa com quintal, Vila Mariana. Sempre pede orcamento antes.')
    RETURNING id INTO v_c2;
  INSERT INTO clients (id, user_id, code, name, phone, source, notes) VALUES
    (gen_random_uuid(), v_uid, '#00003', 'Ana Paula Santos',   '(11) 96543-2109', 'Instagram', 'Condominio Jardins. Sindica, indica pra vizinhos.')
    RETURNING id INTO v_c3;
  INSERT INTO clients (id, user_id, code, name, phone, email, birth_date, source, notes) VALUES
    (gen_random_uuid(), v_uid, '#00004', 'Roberto Lima',       '(11) 95432-1098', 'roberto.lima@gmail.com', '1990-11-30', 'Indicacao', 'Escritorio comercial, Pinheiros. Manutencao mensal.')
    RETURNING id INTO v_c4;
  INSERT INTO clients (id, user_id, code, name, phone, source, notes) VALUES
    (gen_random_uuid(), v_uid, '#00005', 'Patricia Doceira',   '(11) 94321-0987', 'Indicacao', 'Confeitaria no Itaim. Precisa de manutencao frequente.')
    RETURNING id INTO v_c5;
  INSERT INTO clients (id, user_id, code, name, phone, email, birth_date, source) VALUES
    (gen_random_uuid(), v_uid, '#00006', 'Joao Padaria',       '(11) 93210-9876', 'joao.pad@gmail.com', '1982-08-10', 'Passante')
    RETURNING id INTO v_c6;
  INSERT INTO clients (id, user_id, code, name, phone, source, notes) VALUES
    (gen_random_uuid(), v_uid, '#00007', 'Fernanda Costa',     '(11) 92109-8765', 'Instagram', 'Duplex em Moema. Reformou recente, sempre precisa de ajustes.')
    RETURNING id INTO v_c7;
  INSERT INTO clients (id, user_id, code, name, phone, birth_date, source) VALUES
    (gen_random_uuid(), v_uid, '#00008', 'Lucas Almeida',      '(11) 91098-7654', '1995-01-25', 'Google')
    RETURNING id INTO v_c8;

  -- =====================================================
  -- 5. CRIAR AGENDAMENTOS (historico + futuros)
  -- =====================================================
  DELETE FROM appointments WHERE user_id = v_uid;

  -- Atendimentos COMPLETADOS (mes passado e este mes)
  INSERT INTO appointments (user_id, client_id, service_name, scheduled_date, scheduled_time, estimated_value, final_value, status, is_free_return, completed_at) VALUES
    -- Mes passado
    (v_uid, v_c1, 'Instalacao eletrica',    CURRENT_DATE - 25, '09:00', 180, 180, 'completed', false, (CURRENT_DATE - 25)::timestamp),
    (v_uid, v_c2, 'Reparo hidraulico',      CURRENT_DATE - 22, '14:00', 150, 150, 'completed', false, (CURRENT_DATE - 22)::timestamp),
    (v_uid, v_c3, 'Montagem de moveis',     CURRENT_DATE - 20, '10:00', 120, 140, 'completed', false, (CURRENT_DATE - 20)::timestamp),
    (v_uid, v_c4, 'Manutencao geral',       CURRENT_DATE - 18, '08:00', 250, 250, 'completed', false, (CURRENT_DATE - 18)::timestamp),
    (v_uid, v_c5, 'Troca de torneira/chuveiro', CURRENT_DATE - 15, '11:00', 100, 100, 'completed', false, (CURRENT_DATE - 15)::timestamp),
    (v_uid, v_c1, 'Fixacao (TV, prateleira)', CURRENT_DATE - 12, '15:00', 130, 150, 'completed', false, (CURRENT_DATE - 12)::timestamp),
    -- Este mes
    (v_uid, v_c6, 'Pintura (diaria)',        CURRENT_DATE - 10, '08:00', 350, 350, 'completed', false, (CURRENT_DATE - 10)::timestamp),
    (v_uid, v_c7, 'Desentupimento',          CURRENT_DATE - 8,  '09:00', 200, 200, 'completed', false, (CURRENT_DATE - 8)::timestamp),
    (v_uid, v_c2, 'Reparo em porta/janela',  CURRENT_DATE - 6,  '14:00', 160, 180, 'completed', false, (CURRENT_DATE - 6)::timestamp),
    (v_uid, v_c3, 'Instalacao de luminaria', CURRENT_DATE - 4,  '10:00', 80,  80,  'completed', false, (CURRENT_DATE - 4)::timestamp),
    (v_uid, v_c8, 'Troca de fechadura',      CURRENT_DATE - 3,  '16:00', 120, 120, 'completed', false, (CURRENT_DATE - 3)::timestamp),
    (v_uid, v_c4, 'Instalacao de suporte TV',CURRENT_DATE - 1,  '09:00', 150, 150, 'completed', false, (CURRENT_DATE - 1)::timestamp),
    -- Retorno gratuito
    (v_uid, v_c1, 'Instalacao eletrica',     CURRENT_DATE - 2,  '11:00', 0,   0,   'completed', true,  (CURRENT_DATE - 2)::timestamp);

  -- Atendimentos AGENDADOS (futuros)
  INSERT INTO appointments (user_id, client_id, service_name, scheduled_date, scheduled_time, estimated_value, status) VALUES
    (v_uid, v_c5, 'Reparo hidraulico',       CURRENT_DATE,     '14:00', 150, 'confirmed'),
    (v_uid, v_c7, 'Instalacao eletrica',     CURRENT_DATE + 1, '09:00', 180, 'scheduled'),
    (v_uid, v_c6, 'Montagem de moveis',      CURRENT_DATE + 2, '10:00', 120, 'scheduled'),
    (v_uid, v_c8, 'Reparo em gesso/drywall', CURRENT_DATE + 3, '14:00', 200, 'scheduled'),
    (v_uid, v_c1, 'Manutencao geral',        CURRENT_DATE + 5, '08:00', 250, 'scheduled'),
    (v_uid, v_c3, 'Troca de torneira/chuveiro', CURRENT_DATE + 7, '11:00', 100, 'scheduled');

  -- =====================================================
  -- 6. GERAR RECEITAS dos atendimentos completados
  -- =====================================================
  DELETE FROM financial_entries WHERE user_id = v_uid;

  INSERT INTO financial_entries (user_id, type, amount, description, entry_date, client_id, client_name, service_name, status) VALUES
    (v_uid, 'income', 180, 'Instalacao eletrica',        CURRENT_DATE - 25, v_c1, 'Maria Oliveira',   'Instalacao eletrica',    'paid'),
    (v_uid, 'income', 150, 'Reparo hidraulico',          CURRENT_DATE - 22, v_c2, 'Carlos Barbeiro',  'Reparo hidraulico',      'paid'),
    (v_uid, 'income', 140, 'Montagem de moveis',         CURRENT_DATE - 20, v_c3, 'Ana Paula Santos', 'Montagem de moveis',     'paid'),
    (v_uid, 'income', 250, 'Manutencao geral',           CURRENT_DATE - 18, v_c4, 'Roberto Lima',     'Manutencao geral',       'paid'),
    (v_uid, 'income', 100, 'Troca de torneira/chuveiro', CURRENT_DATE - 15, v_c5, 'Patricia Doceira', 'Troca de torneira',      'paid'),
    (v_uid, 'income', 150, 'Fixacao (TV, prateleira)',   CURRENT_DATE - 12, v_c1, 'Maria Oliveira',   'Fixacao TV/prateleira',  'paid'),
    (v_uid, 'income', 350, 'Pintura (diaria)',           CURRENT_DATE - 10, v_c6, 'Joao Padaria',     'Pintura (diaria)',       'paid'),
    (v_uid, 'income', 200, 'Desentupimento',             CURRENT_DATE - 8,  v_c7, 'Fernanda Costa',   'Desentupimento',         'paid'),
    (v_uid, 'income', 180, 'Reparo em porta/janela',     CURRENT_DATE - 6,  v_c2, 'Carlos Barbeiro',  'Reparo porta/janela',    'paid'),
    (v_uid, 'income', 80,  'Instalacao de luminaria',    CURRENT_DATE - 4,  v_c3, 'Ana Paula Santos', 'Instalacao luminaria',   'paid'),
    (v_uid, 'income', 120, 'Troca de fechadura',         CURRENT_DATE - 3,  v_c8, 'Lucas Almeida',    'Troca de fechadura',     'paid'),
    (v_uid, 'income', 150, 'Instalacao de suporte TV',   CURRENT_DATE - 1,  v_c4, 'Roberto Lima',     'Instalacao suporte TV',  'paid');

  -- Despesas CMV
  INSERT INTO financial_entries (user_id, type, amount, description, entry_date, expense_category, status) VALUES
    (v_uid, 'expense', 35,  'CMV: Instalacao eletrica',   CURRENT_DATE - 25, 'cmv', 'paid'),
    (v_uid, 'expense', 40,  'CMV: Reparo hidraulico',     CURRENT_DATE - 22, 'cmv', 'paid'),
    (v_uid, 'expense', 80,  'CMV: Pintura (diaria)',      CURRENT_DATE - 10, 'cmv', 'paid'),
    (v_uid, 'expense', 50,  'CMV: Desentupimento',        CURRENT_DATE - 8,  'cmv', 'paid'),
    (v_uid, 'expense', 35,  'CMV: Reparo porta/janela',   CURRENT_DATE - 6,  'cmv', 'paid'),
    (v_uid, 'expense', 40,  'CMV: Troca fechadura',       CURRENT_DATE - 3,  'cmv', 'paid');

  -- Despesas variaveis
  INSERT INTO financial_entries (user_id, type, amount, description, entry_date, expense_category, status) VALUES
    (v_uid, 'expense', 150, 'Gasolina',                   CURRENT_DATE - 15, 'variable', 'paid'),
    (v_uid, 'expense', 85,  'Material eletrico extra',    CURRENT_DATE - 12, 'variable', 'paid'),
    (v_uid, 'expense', 120, 'Ferramentas novas',          CURRENT_DATE - 5,  'variable', 'paid');

  -- =====================================================
  -- 7. DESPESAS FIXAS
  -- =====================================================
  DELETE FROM fixed_expenses WHERE user_id = v_uid;

  INSERT INTO fixed_expenses (user_id, description, amount, due_day, category, notify, is_active) VALUES
    (v_uid, 'DAS MEI',              70.60, 20, 'Imposto',    true, true),
    (v_uid, 'Seguro van',          180.00, 10, 'Veiculo',    true, true),
    (v_uid, 'Gasolina mensal',     400.00, 1,  'Veiculo',    false, true),
    (v_uid, 'Celular/Internet',     99.90, 15, 'Operacional',true, true),
    (v_uid, 'Manutencao ferramentas',150.00,25,'Operacional',false, true);

  -- =====================================================
  -- 8. HISTORICO DE CLIENTES
  -- =====================================================
  DELETE FROM client_history WHERE user_id = v_uid;

  INSERT INTO client_history (user_id, client_id, event_type, event_date, service_name, value, notes) VALUES
    (v_uid, v_c1, 'completed', CURRENT_DATE - 25, 'Instalacao eletrica',     180, 'Troca de disjuntor + tomadas novas'),
    (v_uid, v_c1, 'completed', CURRENT_DATE - 12, 'Fixacao (TV, prateleira)',150, 'TV 55pol + 3 prateleiras'),
    (v_uid, v_c1, 'completed', CURRENT_DATE - 2,  'Instalacao eletrica',       0, 'Retorno gratuito - ajuste'),
    (v_uid, v_c2, 'completed', CURRENT_DATE - 22, 'Reparo hidraulico',       150, 'Vazamento pia cozinha'),
    (v_uid, v_c2, 'completed', CURRENT_DATE - 6,  'Reparo em porta/janela',  180, 'Porta do banheiro emperrando'),
    (v_uid, v_c3, 'completed', CURRENT_DATE - 20, 'Montagem de moveis',      140, 'Guarda-roupa + mesa escritorio'),
    (v_uid, v_c3, 'completed', CURRENT_DATE - 4,  'Instalacao de luminaria',  80, '3 luminarias LED cozinha'),
    (v_uid, v_c4, 'completed', CURRENT_DATE - 18, 'Manutencao geral',        250, 'Revisao geral escritorio'),
    (v_uid, v_c4, 'completed', CURRENT_DATE - 1,  'Instalacao de suporte TV',150, 'TV sala de reuniao'),
    (v_uid, v_c5, 'completed', CURRENT_DATE - 15, 'Troca de torneira/chuveiro',100,'Torneira da confeitaria'),
    (v_uid, v_c6, 'completed', CURRENT_DATE - 10, 'Pintura (diaria)',         350, 'Pintura fachada padaria'),
    (v_uid, v_c7, 'completed', CURRENT_DATE - 8,  'Desentupimento',           200, 'Ralo banheiro entupido'),
    (v_uid, v_c8, 'completed', CURRENT_DATE - 3,  'Troca de fechadura',       120, 'Fechadura porta principal');

  RAISE NOTICE 'Seed completo! Perfil, % servicos, 8 clientes, agendamentos e financeiro criados.', (SELECT COUNT(*) FROM services WHERE user_id = v_uid);
END $$;

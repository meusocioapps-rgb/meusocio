-- =====================================================
-- MEU SOCIO — DATABASE FUNCTIONS (RPC)
-- Logica critica que roda no banco, nao no frontend
-- =====================================================

-- =====================================================
-- 1. COMPLETAR ATENDIMENTO
-- Atualiza appointment + gera receita + gera CMV + registra historico
-- Tudo em transacao atomica
-- =====================================================
CREATE OR REPLACE FUNCTION complete_appointment(
  p_appointment_id UUID,
  p_final_value    NUMERIC,
  p_is_free_return BOOLEAN DEFAULT false,
  p_notes          TEXT DEFAULT NULL,
  p_upsell_service TEXT DEFAULT NULL,
  p_upsell_value   NUMERIC DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_app appointments%ROWTYPE;
  v_client_name TEXT;
  v_service_cost NUMERIC := 0;
  v_total_income NUMERIC;
BEGIN
  -- Buscar atendimento (RLS ja valida ownership via auth.uid())
  SELECT * INTO v_app
  FROM appointments
  WHERE id = p_appointment_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Atendimento nao encontrado';
  END IF;

  IF v_app.status = 'completed' THEN
    RAISE EXCEPTION 'Atendimento ja foi finalizado';
  END IF;

  -- Buscar nome do cliente
  SELECT name INTO v_client_name
  FROM clients WHERE id = v_app.client_id;

  -- 1. Atualizar status do appointment
  UPDATE appointments SET
    status = 'completed',
    final_value = p_final_value,
    is_free_return = p_is_free_return,
    notes = COALESCE(p_notes, notes),
    upsell_service = p_upsell_service,
    upsell_value = COALESCE(p_upsell_value, 0),
    completed_at = now(),
    updated_at = now()
  WHERE id = p_appointment_id;

  -- 2. Gerar receita (se NAO for retorno gratuito)
  v_total_income := p_final_value + COALESCE(p_upsell_value, 0);

  IF NOT p_is_free_return AND v_total_income > 0 THEN
    INSERT INTO financial_entries
      (user_id, type, amount, description, entry_date,
       client_id, client_name, service_name, appointment_id, status)
    VALUES
      (v_app.user_id, 'income', v_total_income,
       v_app.service_name, v_app.scheduled_date,
       v_app.client_id, v_client_name,
       v_app.service_name, p_appointment_id, 'paid');
  END IF;

  -- 3. Gerar despesa CMV automaticamente (se o servico tem custo)
  IF v_app.service_id IS NOT NULL THEN
    SELECT cost INTO v_service_cost
    FROM services WHERE id = v_app.service_id;
  END IF;

  IF COALESCE(v_service_cost, 0) > 0 THEN
    INSERT INTO financial_entries
      (user_id, type, amount, description, entry_date,
       appointment_id, expense_category)
    VALUES
      (v_app.user_id, 'expense', v_service_cost,
       'CMV: ' || v_app.service_name,
       v_app.scheduled_date, p_appointment_id, 'cmv');
  END IF;

  -- 4. Registrar no historico do cliente
  INSERT INTO client_history
    (user_id, client_id, appointment_id, event_type,
     event_date, service_name, value, notes)
  VALUES
    (v_app.user_id, v_app.client_id, p_appointment_id,
     'completed', v_app.scheduled_date,
     v_app.service_name, p_final_value, p_notes);

  RETURN json_build_object(
    'success', true,
    'appointment_id', p_appointment_id,
    'income_generated', CASE WHEN p_is_free_return THEN 0 ELSE v_total_income END,
    'cmv_generated', COALESCE(v_service_cost, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. REMARCAR ATENDIMENTO
-- Marca o atual como rescheduled + cria novo
-- =====================================================
CREATE OR REPLACE FUNCTION reschedule_appointment(
  p_appointment_id UUID,
  p_new_date       DATE,
  p_new_time       TIME,
  p_notes          TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_app appointments%ROWTYPE;
  v_new_id UUID;
BEGIN
  SELECT * INTO v_app
  FROM appointments
  WHERE id = p_appointment_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Atendimento nao encontrado';
  END IF;

  IF v_app.status IN ('completed', 'rescheduled') THEN
    RAISE EXCEPTION 'Atendimento nao pode ser remarcado (status: %)', v_app.status;
  END IF;

  -- Marcar atual como remarcado
  UPDATE appointments SET
    status = 'rescheduled',
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_appointment_id;

  -- Criar novo atendimento
  INSERT INTO appointments
    (user_id, client_id, service_id, service_name,
     scheduled_date, scheduled_time, estimated_value, status)
  VALUES
    (v_app.user_id, v_app.client_id, v_app.service_id, v_app.service_name,
     p_new_date, p_new_time, v_app.estimated_value, 'scheduled')
  RETURNING id INTO v_new_id;

  -- Historico
  INSERT INTO client_history
    (user_id, client_id, appointment_id, event_type,
     event_date, service_name, notes)
  VALUES
    (v_app.user_id, v_app.client_id, p_appointment_id,
     'rescheduled', v_app.scheduled_date,
     v_app.service_name,
     'Remarcado para ' || p_new_date || ' ' || p_new_time);

  RETURN json_build_object(
    'success', true,
    'old_appointment_id', p_appointment_id,
    'new_appointment_id', v_new_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. MARCAR FALTA / CANCELAMENTO
-- Atualiza status + registra historico
-- =====================================================
CREATE OR REPLACE FUNCTION mark_appointment_status(
  p_appointment_id UUID,
  p_status         TEXT,  -- 'no_show' ou 'cancelled'
  p_notes          TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_app appointments%ROWTYPE;
BEGIN
  IF p_status NOT IN ('no_show', 'cancelled') THEN
    RAISE EXCEPTION 'Status invalido: %. Use no_show ou cancelled', p_status;
  END IF;

  SELECT * INTO v_app
  FROM appointments
  WHERE id = p_appointment_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Atendimento nao encontrado';
  END IF;

  IF v_app.status = 'completed' THEN
    RAISE EXCEPTION 'Atendimento ja finalizado, nao pode alterar';
  END IF;

  UPDATE appointments SET
    status = p_status::appointment_status,
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_appointment_id;

  INSERT INTO client_history
    (user_id, client_id, appointment_id, event_type,
     event_date, service_name, notes)
  VALUES
    (v_app.user_id, v_app.client_id, p_appointment_id,
     p_status, v_app.scheduled_date,
     v_app.service_name, p_notes);

  RETURN json_build_object('success', true, 'status', p_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. DASHBOARD KPIs (query otimizada em 1 chamada)
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  v_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_revenue NUMERIC;
  v_expenses NUMERIC;
  v_pending_income NUMERIC;
  v_completed_count INT;
  v_today_count INT;
  v_active_clients INT;
BEGIN
  -- Faturamento do mes (excluindo retornos gratuitos)
  SELECT COALESCE(SUM(final_value + COALESCE(upsell_value, 0)), 0)
  INTO v_revenue
  FROM appointments
  WHERE user_id = auth.uid()
    AND status = 'completed'
    AND is_free_return = false
    AND scheduled_date >= v_month_start;

  -- Despesas do mes
  SELECT COALESCE(SUM(amount), 0)
  INTO v_expenses
  FROM financial_entries
  WHERE user_id = auth.uid()
    AND type = 'expense'
    AND entry_date >= v_month_start;

  -- Somar despesas fixas ao total
  v_expenses := v_expenses + COALESCE(
    (SELECT SUM(amount) FROM fixed_expenses
     WHERE user_id = auth.uid() AND is_active = true), 0
  );

  -- A receber (pendente)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_income
  FROM financial_entries
  WHERE user_id = auth.uid()
    AND type = 'income'
    AND status = 'pending';

  -- Atendimentos realizados no mes
  SELECT COUNT(*)
  INTO v_completed_count
  FROM appointments
  WHERE user_id = auth.uid()
    AND status = 'completed'
    AND scheduled_date >= v_month_start;

  -- Agendamentos hoje
  SELECT COUNT(*)
  INTO v_today_count
  FROM appointments
  WHERE user_id = auth.uid()
    AND scheduled_date = CURRENT_DATE
    AND status IN ('scheduled', 'confirmed');

  -- Clientes ativos (com pelo menos 1 atendimento realizado)
  SELECT COUNT(DISTINCT client_id)
  INTO v_active_clients
  FROM appointments
  WHERE user_id = auth.uid()
    AND status = 'completed';

  RETURN json_build_object(
    'revenue', v_revenue,
    'expenses', v_expenses,
    'profit', v_revenue - v_expenses,
    'pending_income', v_pending_income,
    'completed_count', v_completed_count,
    'today_count', v_today_count,
    'active_clients', v_active_clients,
    'month_start', v_month_start
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. BUSCAR PROXIMO ATENDIMENTO
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_appointment()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', a.id,
    'client_name', c.name,
    'client_phone', c.phone,
    'service_name', a.service_name,
    'scheduled_date', a.scheduled_date,
    'scheduled_time', a.scheduled_time,
    'estimated_value', a.estimated_value,
    'status', a.status
  )
  INTO v_result
  FROM appointments a
  JOIN clients c ON c.id = a.client_id
  WHERE a.user_id = auth.uid()
    AND a.scheduled_date >= CURRENT_DATE
    AND a.status IN ('scheduled', 'confirmed')
  ORDER BY a.scheduled_date, a.scheduled_time
  LIMIT 1;

  RETURN COALESCE(v_result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. ATENDIMENTOS DO DIA
-- =====================================================
CREATE OR REPLACE FUNCTION get_today_appointments()
RETURNS JSON AS $$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(row_to_json(t))
     FROM (
       SELECT
         a.id,
         c.name AS client_name,
         c.phone AS client_phone,
         a.service_name,
         a.scheduled_time,
         a.estimated_value,
         a.status
       FROM appointments a
       JOIN clients c ON c.id = a.client_id
       WHERE a.user_id = auth.uid()
         AND a.scheduled_date = CURRENT_DATE
       ORDER BY a.scheduled_time
     ) t),
    '[]'::JSON
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CLIENTES QUE PRECISAM DE REATIVACAO
-- =====================================================
CREATE OR REPLACE FUNCTION get_clients_to_reactivate()
RETURNS JSON AS $$
DECLARE
  v_days INT;
BEGIN
  SELECT reactivation_days INTO v_days
  FROM settings WHERE user_id = auth.uid();

  v_days := COALESCE(v_days, 30);

  RETURN COALESCE(
    (SELECT json_agg(row_to_json(t))
     FROM (
       SELECT
         c.id,
         c.name,
         c.phone,
         MAX(a.scheduled_date) AS last_visit,
         CURRENT_DATE - MAX(a.scheduled_date) AS days_absent,
         COUNT(a.id) AS total_visits
       FROM clients c
       JOIN appointments a ON a.client_id = c.id AND a.status = 'completed'
       WHERE c.user_id = auth.uid()
         AND c.is_removed_from_reactivation = false
         AND NOT EXISTS (
           SELECT 1 FROM appointments a2
           WHERE a2.client_id = c.id
             AND a2.status IN ('scheduled', 'confirmed')
             AND a2.scheduled_date >= CURRENT_DATE
         )
       GROUP BY c.id, c.name, c.phone
       HAVING CURRENT_DATE - MAX(a.scheduled_date) > v_days
       ORDER BY MAX(a.scheduled_date) ASC
     ) t),
    '[]'::JSON
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CLIENTES RECORRENTES
-- =====================================================
CREATE OR REPLACE FUNCTION get_recurrent_clients()
RETURNS JSON AS $$
DECLARE
  v_min_visits INT;
BEGIN
  SELECT recurrence_min_visits INTO v_min_visits
  FROM settings WHERE user_id = auth.uid();

  v_min_visits := COALESCE(v_min_visits, 3);

  RETURN COALESCE(
    (SELECT json_agg(row_to_json(t))
     FROM (
       SELECT
         c.id,
         c.name,
         c.phone,
         COUNT(a.id) AS total_visits,
         MAX(a.scheduled_date) AS last_visit,
         SUM(COALESCE(a.final_value, a.estimated_value)) AS total_spent
       FROM clients c
       JOIN appointments a ON a.client_id = c.id AND a.status = 'completed'
       WHERE c.user_id = auth.uid()
         AND c.is_removed_from_recurrence = false
       GROUP BY c.id, c.name, c.phone
       HAVING COUNT(a.id) >= v_min_visits
       ORDER BY COUNT(a.id) DESC
     ) t),
    '[]'::JSON
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. RESUMO FINANCEIRO POR MES
-- =====================================================
CREATE OR REPLACE FUNCTION get_financial_summary(
  p_start_date DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE,
  p_end_date   DATE DEFAULT (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'income_total',
    COALESCE((
      SELECT SUM(amount) FROM financial_entries
      WHERE user_id = auth.uid() AND type = 'income'
        AND entry_date BETWEEN p_start_date AND p_end_date
    ), 0),

    'income_paid',
    COALESCE((
      SELECT SUM(amount) FROM financial_entries
      WHERE user_id = auth.uid() AND type = 'income' AND status = 'paid'
        AND entry_date BETWEEN p_start_date AND p_end_date
    ), 0),

    'income_pending',
    COALESCE((
      SELECT SUM(amount) FROM financial_entries
      WHERE user_id = auth.uid() AND type = 'income' AND status = 'pending'
        AND entry_date BETWEEN p_start_date AND p_end_date
    ), 0),

    'expenses_total',
    COALESCE((
      SELECT SUM(amount) FROM financial_entries
      WHERE user_id = auth.uid() AND type = 'expense'
        AND entry_date BETWEEN p_start_date AND p_end_date
    ), 0),

    'expenses_cmv',
    COALESCE((
      SELECT SUM(amount) FROM financial_entries
      WHERE user_id = auth.uid() AND type = 'expense' AND expense_category = 'cmv'
        AND entry_date BETWEEN p_start_date AND p_end_date
    ), 0),

    'fixed_expenses',
    COALESCE((
      SELECT SUM(amount) FROM fixed_expenses
      WHERE user_id = auth.uid() AND is_active = true
    ), 0),

    'period_start', p_start_date,
    'period_end', p_end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. NOTIFICACOES DO USUARIO (aniversarios, sumidos, etc)
-- =====================================================
CREATE OR REPLACE FUNCTION get_notifications()
RETURNS JSON AS $$
DECLARE
  v_settings settings%ROWTYPE;
  v_notifications JSON[];
  v_item JSON;
BEGIN
  SELECT * INTO v_settings FROM settings WHERE user_id = auth.uid();

  v_notifications := '{}';

  -- Aniversarios proximos (7 dias)
  IF COALESCE(v_settings.notify_birthday, true) THEN
    FOR v_item IN
      SELECT json_build_object(
        'type', 'birthday',
        'client_id', c.id,
        'client_name', c.name,
        'birth_date', c.birth_date,
        'days_until', CASE
          WHEN (c.birth_date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM c.birth_date))::INT * INTERVAL '1 year'))::DATE < CURRENT_DATE
          THEN (c.birth_date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM c.birth_date) + 1)::INT * INTERVAL '1 year'))::DATE - CURRENT_DATE
          ELSE (c.birth_date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM c.birth_date))::INT * INTERVAL '1 year'))::DATE - CURRENT_DATE
        END
      )
      FROM clients c
      WHERE c.user_id = auth.uid()
        AND c.birth_date IS NOT NULL
        AND (
          (c.birth_date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM c.birth_date))::INT * INTERVAL '1 year'))::DATE
            BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
          OR
          (c.birth_date + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM c.birth_date) + 1)::INT * INTERVAL '1 year'))::DATE
            BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
        )
    LOOP
      v_notifications := array_append(v_notifications, v_item);
    END LOOP;
  END IF;

  -- Despesas fixas vencendo em 7 dias
  IF COALESCE(v_settings.notify_fixed_expenses, true) THEN
    FOR v_item IN
      SELECT json_build_object(
        'type', 'fixed_expense',
        'description', f.description,
        'amount', f.amount,
        'due_day', f.due_day,
        'days_until', CASE
          WHEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM CURRENT_DATE)::INT, LEAST(f.due_day, 28)) >= CURRENT_DATE
          THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM CURRENT_DATE)::INT, LEAST(f.due_day, 28)) - CURRENT_DATE
          ELSE make_date(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM CURRENT_DATE)::INT, LEAST(f.due_day, 28))
               + INTERVAL '1 month' - CURRENT_DATE
        END
      )
      FROM fixed_expenses f
      WHERE f.user_id = auth.uid()
        AND f.is_active = true
        AND f.notify = true
        AND f.due_day IS NOT NULL
    LOOP
      IF (v_item->>'days_until')::INT BETWEEN 0 AND 7 THEN
        v_notifications := array_append(v_notifications, v_item);
      END IF;
    END LOOP;
  END IF;

  RETURN COALESCE(array_to_json(v_notifications), '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

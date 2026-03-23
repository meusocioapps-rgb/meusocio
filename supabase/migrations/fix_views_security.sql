-- =====================================================
-- FIX CRITICO: Views com security_invoker para respeitar RLS
-- Execute no SQL Editor do Supabase IMEDIATAMENTE
-- =====================================================

-- 1. Recriar view clients_with_status COM security_invoker
DROP VIEW IF EXISTS clients_with_status;
CREATE VIEW clients_with_status
WITH (security_invoker = true)
AS
SELECT
  c.*,
  COALESCE(stats.total_visits, 0) AS total_visits,
  stats.last_visit,
  COALESCE(stats.total_spent, 0) AS total_spent,
  stats.last_service,
  CASE
    WHEN c.is_removed_from_reactivation THEN false
    WHEN stats.last_visit IS NOT NULL
      AND stats.last_visit < CURRENT_DATE - (
        SELECT COALESCE(s.reactivation_days, 30)
        FROM settings s WHERE s.user_id = c.user_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.client_id = c.id
          AND a.status IN ('scheduled', 'confirmed')
          AND a.scheduled_date >= CURRENT_DATE
      )
    THEN true
    ELSE false
  END AS needs_reactivation,
  CASE
    WHEN c.is_removed_from_recurrence THEN false
    WHEN COALESCE(stats.total_visits, 0) >= (
      SELECT COALESCE(s.recurrence_min_visits, 3)
      FROM settings s WHERE s.user_id = c.user_id
    )
    THEN true
    ELSE false
  END AS is_recurrent,
  CASE
    WHEN stats.last_visit IS NULL THEN 'new'
    WHEN stats.last_visit >= CURRENT_DATE - 30 THEN 'active'
    ELSE 'inactive'
  END AS activity_status
FROM clients c
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS total_visits,
    MAX(a.scheduled_date) AS last_visit,
    SUM(COALESCE(a.final_value, a.estimated_value)) AS total_spent,
    (SELECT a2.service_name FROM appointments a2
     WHERE a2.client_id = c.id AND a2.status = 'completed'
     ORDER BY a2.scheduled_date DESC LIMIT 1) AS last_service
  FROM appointments a
  WHERE a.client_id = c.id AND a.status = 'completed'
) stats ON true;

-- 2. Recriar view appointments_with_client COM security_invoker
DROP VIEW IF EXISTS appointments_with_client;
CREATE VIEW appointments_with_client
WITH (security_invoker = true)
AS
SELECT
  a.*,
  c.name AS client_name,
  c.phone AS client_phone,
  c.email AS client_email
FROM appointments a
JOIN clients c ON c.id = a.client_id;

-- 3. Recriar view financial_with_details COM security_invoker
DROP VIEW IF EXISTS financial_with_details;
CREATE VIEW financial_with_details
WITH (security_invoker = true)
AS
SELECT
  f.*,
  c.name AS resolved_client_name,
  c.phone AS client_phone
FROM financial_entries f
LEFT JOIN clients c ON c.id = f.client_id;

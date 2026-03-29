-- Function para excluir usuario e TODOS os dados relacionados (LGPD Art. 18)
-- Apenas o admin ou o proprio usuario pode executar

CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verificar permissao: admin ou proprio usuario
  IF auth.uid() != target_user_id AND
     (auth.jwt() ->> 'email') != COALESCE(current_setting('app.admin_email', true), 'meusocio.apps@gmail.com') THEN
    RAISE EXCEPTION 'Nao autorizado a excluir este usuario';
  END IF;

  -- Deletar todos os dados do usuario em ordem (respeitando foreign keys)
  DELETE FROM notification_log WHERE user_id = target_user_id;
  DELETE FROM client_history WHERE user_id = target_user_id;
  DELETE FROM appointments WHERE user_id = target_user_id;
  DELETE FROM financial_entries WHERE user_id = target_user_id;
  DELETE FROM fixed_expenses WHERE user_id = target_user_id;
  DELETE FROM clients WHERE user_id = target_user_id;
  DELETE FROM services WHERE user_id = target_user_id;
  DELETE FROM custom_fields WHERE user_id = target_user_id;
  DELETE FROM feedback WHERE user_id = target_user_id;
  DELETE FROM settings WHERE user_id = target_user_id;
  DELETE FROM subscriptions WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;
END;
$$;

-- Migração: Proteção de Segurança Máxima para Funções Administrativas
-- Todas as funções agora exigem e-mail oficial do proprietário e senha administrativa

-- 1. Listar assinantes com verificação de credencial
CREATE OR REPLACE FUNCTION get_admin_subscriptions(
  p_admin_email TEXT,
  p_admin_secret TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  customer_name TEXT,
  status TEXT,
  billing_type TEXT,
  value NUMERIC,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  asaas_payment_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF lower(trim(p_admin_email)) <> 'rodrigorbes@gmail.com' OR p_admin_secret <> 'Rbs.1682' THEN
    RAISE EXCEPTION 'Acesso Negado: Credenciais administrativas inválidas.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.customer_name,
    p.status,
    p.billing_type,
    p.value,
    p.expires_at,
    p.created_at,
    p.updated_at,
    p.asaas_payment_id
  FROM pro_subscriptions p
  ORDER BY p.created_at DESC;
END;
$$;

-- 2. Inserir ou atualizar assinante com verificação
CREATE OR REPLACE FUNCTION admin_upsert_subscription(
  p_admin_email TEXT,
  p_admin_secret TEXT,
  p_email TEXT,
  p_name TEXT,
  p_status TEXT,
  p_billing_type TEXT,
  p_expires_at TIMESTAMPTZ,
  p_value NUMERIC DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF lower(trim(p_admin_email)) <> 'rodrigorbes@gmail.com' OR p_admin_secret <> 'Rbs.1682' THEN
    RAISE EXCEPTION 'Acesso Negado: Credenciais administrativas inválidas.';
  END IF;

  INSERT INTO pro_subscriptions (
    email,
    customer_name,
    status,
    billing_type,
    expires_at,
    value,
    updated_at
  )
  VALUES (
    lower(trim(p_email)),
    trim(p_name),
    coalesce(p_status, 'active'),
    coalesce(p_billing_type, 'MANUAL_PIX'),
    p_expires_at,
    coalesce(p_value, 29.90),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    status = EXCLUDED.status,
    billing_type = EXCLUDED.billing_type,
    expires_at = EXCLUDED.expires_at,
    value = EXCLUDED.value,
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- 3. Alternar status com verificação
CREATE OR REPLACE FUNCTION admin_toggle_subscription_status(
  p_admin_email TEXT,
  p_admin_secret TEXT,
  p_email TEXT,
  p_new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF lower(trim(p_admin_email)) <> 'rodrigorbes@gmail.com' OR p_admin_secret <> 'Rbs.1682' THEN
    RAISE EXCEPTION 'Acesso Negado: Credenciais administrativas inválidas.';
  END IF;

  UPDATE pro_subscriptions
  SET status = p_new_status, updated_at = now()
  WHERE lower(email) = lower(trim(p_email));
  RETURN TRUE;
END;
$$;

-- 4. Estender validade com verificação
CREATE OR REPLACE FUNCTION admin_extend_subscription(
  p_admin_email TEXT,
  p_admin_secret TEXT,
  p_email TEXT,
  p_days INTEGER
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_expires TIMESTAMPTZ;
  v_current_expires TIMESTAMPTZ;
BEGIN
  IF lower(trim(p_admin_email)) <> 'rodrigorbes@gmail.com' OR p_admin_secret <> 'Rbs.1682' THEN
    RAISE EXCEPTION 'Acesso Negado: Credenciais administrativas inválidas.';
  END IF;

  SELECT expires_at INTO v_current_expires
  FROM pro_subscriptions
  WHERE lower(email) = lower(trim(p_email));

  IF p_days >= 30000 THEN
    v_new_expires := '2099-12-31 23:59:59+00'::TIMESTAMPTZ;
  ELSE
    v_new_expires := GREATEST(now(), coalesce(v_current_expires, now())) + (p_days || ' days')::INTERVAL;
  END IF;

  UPDATE pro_subscriptions
  SET expires_at = v_new_expires, status = 'active', updated_at = now()
  WHERE lower(email) = lower(trim(p_email));

  RETURN v_new_expires;
END;
$$;

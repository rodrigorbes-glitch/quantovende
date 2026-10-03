-- Migração: Gestão Dinâmica de Senha Master (Admin) e Senha do Usuário

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insere as credenciais padrão do admin se não existirem
INSERT INTO app_settings (key, value)
VALUES 
  ('admin_email', 'rodrigorbes@gmail.com'),
  ('admin_secret', 'Rbs.1682')
ON CONFLICT (key) DO NOTHING;

-- Função auxiliar interna para verificar credenciais do admin
CREATE OR REPLACE FUNCTION verify_admin_credentials_internal(p_email TEXT, p_secret TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_secret TEXT;
BEGIN
  SELECT value INTO v_email FROM app_settings WHERE key = 'admin_email';
  SELECT value INTO v_secret FROM app_settings WHERE key = 'admin_secret';

  v_email := coalesce(v_email, 'rodrigorbes@gmail.com');
  v_secret := coalesce(v_secret, 'Rbs.1682');

  RETURN (lower(trim(p_email)) = lower(trim(v_email)) AND p_secret = v_secret);
END;
$$;

-- Função para o admin alterar sua própria senha
CREATE OR REPLACE FUNCTION admin_change_password(
  p_admin_email TEXT,
  p_current_secret TEXT,
  p_new_secret TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT verify_admin_credentials_internal(p_admin_email, p_current_secret) THEN
    RAISE EXCEPTION 'Acesso Negado: Senha atual incorreta.';
  END IF;

  IF length(trim(p_new_secret)) < 4 THEN
    RAISE EXCEPTION 'A nova senha deve ter pelo menos 4 caracteres.';
  END IF;

  INSERT INTO app_settings (key, value, updated_at)
  VALUES ('admin_secret', trim(p_new_secret), now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

  RETURN TRUE;
END;
$$;

-- Atualização das funções administrativas para usar a verificação dinâmica:

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
  IF NOT verify_admin_credentials_internal(p_admin_email, p_admin_secret) THEN
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
  IF NOT verify_admin_credentials_internal(p_admin_email, p_admin_secret) THEN
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
  IF NOT verify_admin_credentials_internal(p_admin_email, p_admin_secret) THEN
    RAISE EXCEPTION 'Acesso Negado: Credenciais administrativas inválidas.';
  END IF;

  UPDATE pro_subscriptions
  SET status = p_new_status, updated_at = now()
  WHERE lower(email) = lower(trim(p_email));
  RETURN TRUE;
END;
$$;

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
  IF NOT verify_admin_credentials_internal(p_admin_email, p_admin_secret) THEN
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

-- Suporte a senha individual do usuário/assinante
ALTER TABLE pro_subscriptions 
ADD COLUMN IF NOT EXISTS user_password TEXT;

-- Função para o usuário alterar/definir sua senha
CREATE OR REPLACE FUNCTION user_set_password(
  p_email TEXT,
  p_current_password TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_pwd TEXT;
  v_exists BOOLEAN;
BEGIN
  SELECT (count(*) > 0), max(user_password)
  INTO v_exists, v_stored_pwd
  FROM pro_subscriptions
  WHERE lower(email) = lower(trim(p_email));

  IF NOT v_exists THEN
    RETURN jsonb_build_object('success', false, 'message', 'E-mail não encontrado entre os assinantes.');
  END IF;

  IF v_stored_pwd IS NOT NULL AND v_stored_pwd <> '' THEN
    IF p_current_password IS NULL OR p_current_password <> v_stored_pwd THEN
      RETURN jsonb_build_object('success', false, 'message', 'Senha atual incorreta.');
    END IF;
  END IF;

  IF length(trim(p_new_password)) < 4 THEN
    RETURN jsonb_build_object('success', false, 'message', 'A nova senha deve ter no mínimo 4 caracteres.');
  END IF;

  UPDATE pro_subscriptions
  SET user_password = trim(p_new_password), updated_at = now()
  WHERE lower(email) = lower(trim(p_email));

  RETURN jsonb_build_object('success', true, 'message', 'Senha atualizada com sucesso!');
END;
$$;

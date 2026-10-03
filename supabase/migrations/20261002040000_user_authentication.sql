-- Migração: Autenticação Segura com Senha e Recuperação Automática de Senha para Assinantes

ALTER TABLE pro_subscriptions
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMPTZ;

-- 1. Função de autenticação de assinante com suporte a senha
CREATE OR REPLACE FUNCTION user_authenticate(
  p_email TEXT,
  p_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub pro_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_sub
  FROM pro_subscriptions
  WHERE lower(email) = lower(trim(p_email));

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'Nenhuma assinatura encontrada para este e-mail. Verifique se digitou o mesmo e-mail usado na compra.'
    );
  END IF;

  IF v_sub.status <> 'active' OR v_sub.expires_at <= now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'EXPIRED',
      'message', 'Sua assinatura PRO está vencida ou suspensa. Renove para continuar usando.'
    );
  END IF;

  -- Se o usuário já cadastrou uma senha no QuantoVende:
  IF v_sub.user_password IS NOT NULL AND v_sub.user_password <> '' THEN
    IF p_password IS NULL OR trim(p_password) = '' THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'PASSWORD_REQUIRED',
        'message', 'Esta conta possui senha cadastrada. Digite sua senha para entrar.'
      );
    END IF;

    IF v_sub.user_password <> trim(p_password) THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'WRONG_PASSWORD',
        'message', 'Senha incorreta. Clique em "Esqueceu a senha?" se precisar redefinir.'
      );
    END IF;
  ELSE
    -- Primeiro acesso (ainda não cadastrou senha):
    -- Se o usuário digitou uma senha válida de pelo menos 4 caracteres, salva automaticamente como sua senha!
    IF p_password IS NOT NULL AND length(trim(p_password)) >= 4 THEN
      UPDATE pro_subscriptions
      SET user_password = trim(p_password), updated_at = now()
      WHERE id = v_sub.id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'email', v_sub.email,
    'customer_name', v_sub.customer_name,
    'expires_at', v_sub.expires_at,
    'has_password', (v_sub.user_password IS NOT NULL AND v_sub.user_password <> '')
  );
END;
$$;

-- 2. Solicitação de recuperação de senha (gera token de redefinição)
CREATE OR REPLACE FUNCTION user_request_password_reset(
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
  v_token TEXT;
BEGIN
  SELECT (count(*) > 0) INTO v_exists
  FROM pro_subscriptions
  WHERE lower(email) = lower(trim(p_email));

  IF NOT v_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'E-mail não encontrado entre os assinantes cadastrados.'
    );
  END IF;

  -- Gera código numérico de 6 dígitos
  v_token := lpad(floor(random() * 900000 + 100000)::TEXT, 6, '0');

  UPDATE pro_subscriptions
  SET 
    reset_token = v_token,
    reset_expires_at = now() + INTERVAL '30 minutes',
    updated_at = now()
  WHERE lower(email) = lower(trim(p_email));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Código de recuperação gerado com sucesso.',
    'token', v_token
  );
END;
$$;

-- 3. Redefinição de senha com o código
CREATE OR REPLACE FUNCTION user_reset_password_with_token(
  p_email TEXT,
  p_token TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub pro_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_sub
  FROM pro_subscriptions
  WHERE lower(email) = lower(trim(p_email));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'E-mail não encontrado.');
  END IF;

  IF v_sub.reset_token IS NULL OR trim(v_sub.reset_token) <> trim(p_token) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Código de recuperação inválido ou incorreto.');
  END IF;

  IF v_sub.reset_expires_at IS NULL OR v_sub.reset_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'message', 'O código de recuperação expirou (validade: 30 min). Solicite outro.');
  END IF;

  IF length(trim(p_new_password)) < 4 THEN
    RETURN jsonb_build_object('success', false, 'message', 'A nova senha deve ter no mínimo 4 caracteres.');
  END IF;

  UPDATE pro_subscriptions
  SET 
    user_password = trim(p_new_password),
    reset_token = NULL,
    reset_expires_at = NULL,
    updated_at = now()
  WHERE id = v_sub.id;

  RETURN jsonb_build_object('success', true, 'message', 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.');
END;
$$;

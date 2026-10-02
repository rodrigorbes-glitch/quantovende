-- Migração: Criação da tabela de assinaturas PRO e função segura de consulta

CREATE TABLE IF NOT EXISTS pro_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  asaas_customer_id TEXT,
  asaas_payment_id TEXT,
  asaas_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'overdue', 'refunded')),
  billing_type TEXT,
  value NUMERIC,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexação rápida por e-mail minúsculo
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_email ON pro_subscriptions (lower(email));

-- Habilita RLS
ALTER TABLE pro_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política restritiva: Acesso direto bloqueado por padrão para anon
-- Apenas service_role (usada pela Edge Function do Webhook) tem controle total
CREATE POLICY "Service role full access on pro_subscriptions"
  ON pro_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Função RPC Segura para consulta pelo Frontend sem expor os dados da tabela
CREATE OR REPLACE FUNCTION check_pro_subscription(lookup_email TEXT)
RETURNS TABLE (
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  customer_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (p.status = 'active' AND p.expires_at > now()) AS is_active,
    p.expires_at,
    p.customer_name
  FROM pro_subscriptions p
  WHERE lower(p.email) = lower(trim(lookup_email))
  ORDER BY p.expires_at DESC
  LIMIT 1;
END;
$$;

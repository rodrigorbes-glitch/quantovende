-- Migration para armazenar credenciais OAuth com suporte a OCC (Optimistic Concurrency Control)
-- Os tokens NÃO devem ser salvos em plain text. A Edge Function fará criptografia AES-GCM em nível de aplicação.

CREATE TABLE oauth_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace VARCHAR(50) NOT NULL,
    seller_user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,  -- Formato esperado: base64(iv):base64(ciphertext)
    refresh_token TEXT NOT NULL, -- Formato esperado: base64(iv):base64(ciphertext)
    expires_at TIMESTAMPTZ,
    refresh_lock_until TIMESTAMPTZ, -- Single-flight distribuído
    refresh_lock_token UUID, -- Identificador da instância com o lock
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (marketplace, seller_user_id)
);

-- Habilita RLS. 
-- Nenhuma política pública é criada, tornando a tabela invisível e inatingível pelo Frontend (anon/authenticated).
-- Apenas chamadas server-side (Edge Functions com service_role_key) conseguirão operar.
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;

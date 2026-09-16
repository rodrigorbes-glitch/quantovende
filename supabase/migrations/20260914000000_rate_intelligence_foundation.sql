-- ==============================================================================
-- QUANTOVENDE: RATE INTELLIGENCE FOUNDATION
-- Migration Version: 20260914000000
-- ==============================================================================

-- 1. ENUMS
CREATE TYPE source_type AS ENUM ('OFFICIAL_API', 'OFFICIAL_DOCUMENTATION', 'OFFICIAL_SELLER_PAGE', 'AUTHORIZED_FEED', 'MANUAL_REVIEW');
CREATE TYPE rate_status AS ENUM ('ACTIVE', 'PENDING_REVIEW', 'MANUAL_REVIEW', 'SUPERSEDED', 'REJECTED');
CREATE TYPE validation_severity AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');
CREATE TYPE change_impact AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- 2. TABLES

-- 2.1 rate_sources (Fontes oficiais de coleta)
CREATE TABLE rate_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    source_type source_type NOT NULL,
    source_url TEXT,
    authority_level INT DEFAULT 1, -- Nível de confiança da fonte
    automation_allowed BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 marketplace_rate_profiles (O perfil de taxas "atual" exposto para cada marketplace)
CREATE TABLE marketplace_rate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace VARCHAR(50) NOT NULL UNIQUE,
    profile_name VARCHAR(255) NOT NULL,
    status rate_status NOT NULL DEFAULT 'MANUAL_REVIEW',
    current_version_id UUID, -- Fk adicionada no final para evitar referência circular
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 marketplace_rate_versions (O histórico imutável de taxas)
CREATE TABLE marketplace_rate_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES marketplace_rate_profiles(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_until TIMESTAMPTZ,
    source_id UUID REFERENCES rate_sources(id),
    source_reference TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    confidence INT NOT NULL DEFAULT 100,
    status rate_status NOT NULL DEFAULT 'PENDING_REVIEW',
    rules_json JSONB NOT NULL,
    checksum VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (profile_id, checksum)
);

-- Atualizando FK pendente
ALTER TABLE marketplace_rate_profiles 
ADD CONSTRAINT fk_current_version FOREIGN KEY (current_version_id) REFERENCES marketplace_rate_versions(id) ON DELETE SET NULL;

-- 2.4 rate_changes (Log de alterações detectadas)
CREATE TABLE rate_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace VARCHAR(50) NOT NULL,
    profile_id UUID NOT NULL REFERENCES marketplace_rate_profiles(id),
    previous_version_id UUID REFERENCES marketplace_rate_versions(id),
    new_version_id UUID REFERENCES marketplace_rate_versions(id),
    change_type VARCHAR(50) NOT NULL,
    change_summary TEXT,
    impact_level change_impact NOT NULL DEFAULT 'LOW',
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    status VARCHAR(50) DEFAULT 'PENDING_REVIEW'
);

-- 2.5 rate_collection_runs (Auditoria de execução de jobs de coleta)
CREATE TABLE rate_collection_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES rate_sources(id),
    marketplace VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL,
    records_found INT DEFAULT 0,
    records_validated INT DEFAULT 0,
    changes_detected INT DEFAULT 0,
    error_code VARCHAR(100),
    error_message_safe TEXT,
    metadata_json JSONB
);

-- 2.6 rate_validation_events (Logs de validação - falhas do Validator)
CREATE TABLE rate_validation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace VARCHAR(50) NOT NULL,
    source_id UUID REFERENCES rate_sources(id),
    version_id UUID REFERENCES marketplace_rate_versions(id),
    validation_type VARCHAR(100) NOT NULL,
    severity validation_severity NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 rate_admin_audit_log (Auditoria de ações humanas/administrativas)
CREATE TABLE rate_admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    metadata_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS - SEGURANÇA NO NÍVEL DA LINHA

-- Habilitar RLS em todas as tabelas
ALTER TABLE rate_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_rate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_rate_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_collection_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_validation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 3.1 Acesso Público (Leitura): O Frontend precisa ler apenas as taxas (Profiles e Versions)
-- Permitido para `anon` e `authenticated` via `SELECT`.
CREATE POLICY "Leitura pública de perfis de taxas" 
ON marketplace_rate_profiles FOR SELECT USING (true);

CREATE POLICY "Leitura pública de versões de taxas" 
ON marketplace_rate_versions FOR SELECT USING (true);

-- As outras tabelas (sources, changes, runs, validations, admin logs) não possuem políticas 
-- de acesso para roles 'anon' ou 'authenticated', o que significa que o PostgREST negará acesso
-- automático para o cliente frontend. Apenas operações server-side (usando service_role)
-- conseguirão ler ou gravar nelas, garantindo total segurança contra explorações client-side.

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX idx_marketplace_profile_marketplace ON marketplace_rate_profiles(marketplace);
CREATE INDEX idx_marketplace_versions_profile ON marketplace_rate_versions(profile_id);
CREATE INDEX idx_marketplace_versions_status ON marketplace_rate_versions(status);
CREATE INDEX idx_rate_changes_detected ON rate_changes(detected_at);

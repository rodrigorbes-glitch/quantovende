-- ==========================================
-- QUANTOVENDE: RATE INTELLIGENCE SEED
-- ==========================================

-- 1. SEED: rate_sources
INSERT INTO rate_sources (id, marketplace, name, source_type, source_url, authority_level, automation_allowed, active)
VALUES 
    -- Mercado Livre: API Oficial conectada via Edge Function
    ('00000000-0000-4000-a000-000000000001', 'mercadolivre', 'Mercado Livre Listing Prices API', 'OFFICIAL_API', 'https://api.mercadolibre.com/sites/MLB/listing_prices', 1, true, true),
    
    -- Amazon: Requer SP-API manual setup, portanto MANUAL_REVIEW
    ('00000000-0000-4000-a000-000000000002', 'amazon', 'Amazon Seller Central SP-API', 'OFFICIAL_API', 'https://developer-docs.amazon.com/sp-api/', 1, false, true),
    
    -- Shopee: Restrito por cloudflare/login, portanto MANUAL_REVIEW
    ('00000000-0000-4000-a000-000000000003', 'shopee', 'Shopee Seller Education Hub', 'MANUAL_REVIEW', 'https://seller.shopee.com.br/edu/article/18978', 2, false, true)
ON CONFLICT DO NOTHING;

-- 2. SEED: marketplace_rate_profiles (O "Header" de cada mercado)
INSERT INTO marketplace_rate_profiles (id, marketplace, profile_name, status)
VALUES
    ('11111111-1111-4000-a000-000000000001', 'mercadolivre', 'Mercado Livre (Referência)', 'MANUAL_REVIEW'),
    ('11111111-1111-4000-a000-000000000002', 'amazon', 'Amazon (Referência)', 'MANUAL_REVIEW'),
    ('11111111-1111-4000-a000-000000000003', 'shopee', 'Shopee (Referência)', 'MANUAL_REVIEW')
ON CONFLICT (marketplace) DO NOTHING;

-- Nota: Não criamos rate_versions sintéticas com "new Date()" aqui, conforme instruído:
-- "Não inventar vigência. Não inventar taxa. Se um dado ainda não tiver confirmação: usar status apropriado. Exemplo: MANUAL_REVIEW"

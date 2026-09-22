INSERT INTO rate_sources (marketplace, name, source_type, source_url, authority_level, automation_allowed, active)
VALUES ('amazon', 'Amazon Brasil Oficial', 'OFFICIAL_API', 'https://venda.amazon.com.br/precos', 1, true, true)
ON CONFLICT DO NOTHING;

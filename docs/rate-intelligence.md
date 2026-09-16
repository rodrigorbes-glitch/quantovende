# Rate Intelligence 1.0 + Supabase Foundation

## Visão Geral da Arquitetura
A plataforma QuantoVende está evoluindo de uma calculadora local estática para um sistema assíncrono e inteligente de rastreamento de taxas, onde a integridade da conta e o histórico persistem de forma segura num banco de dados.

O banco oficial de persistência da infraestrutura é o **Supabase (PostgreSQL)**.

## O Pipeline

1. **Adapters (Collectors)**
   Responsáveis por conectar a fontes oficiais. O frontend não executa adapters diretamente para evitar quebra de proxies (CORS), vazamento de tokens e manipulação. Adapters viverão no server-side (ex: Edge Functions).
2. **Normalizer**
   Converte o payload bruto de terceiros num DTO tipado (`NormalizedRateProfile`).
3. **Validator**
   Garante que uma falha da API da Amazon ou do ML não injete no nosso banco "comissões de 10.000%".
4. **Change Detector**
   Detecta se o payload normalizado difere da regra ativa (previne updates vazios e versiona mutações reais).
5. **Publisher**
   Aprova a mudança validada para o Supabase (grava na tabela `marketplace_rate_versions`).

## Banco de Dados
A modelagem priorizou imutabilidade histórica (nenhuma regra sobreposta é descartada) através de 7 tabelas. Elas são blindadas via **Row Level Security (RLS)**:
- `marketplace_rate_profiles` / `marketplace_rate_versions`: Liberação apenas de `SELECT` para anônimos (ou autenticados).
- `rate_sources`, `rate_changes`, `rate_collection_runs`, etc: Trancadas. Somente processos administrativos/Edge Functions possuem inserção e edição usando `SERVICE_ROLE_KEY`.

## Segurança / Secrets
- Nenhum scraping proibido foi codificado; o foco é usar fontes *white-hat* (documentação sem CAPTCHA/robots bloqueando) e SP-APIs.
- Tokens e senhas (`SERVICE_ROLE`, `CRON_SECRET`, chaves da Amazon) são alocadas *exclusivamente* no backend e omitidas de qualquer payload e build React via Vercel ou Vite (.env restrito).

## Cron / Automação (Roadmap)
A automação depende do endpoint `/api/rate-intelligence/update` invocado pelo Vercel Cron diariamente (limitado a 1~2 execuções para evitar custos altos e bans). Esse processo orquestra o Pipeline listado acima de forma atômica e registra auditorias.

## Resiliência do Frontend (Fallback)
O Frontend é agnóstico à falha do Supabase. A inicialização da loja de taxas sempre usa o fallback estático e persistido, disparando atualizações SWR ("Stale-While-Revalidate") posteriormente se o Supabase estiver online.

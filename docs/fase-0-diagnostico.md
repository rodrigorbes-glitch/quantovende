# FASE 0: Diagnóstico de Arquitetura

## Arquitetura Atual Encontrada
- **Frontend:** React + Vite, TailwindCSS, tipagem forte com TypeScript.
- **Store:** Zustand (`src/store/usePricingStore.ts`) com persistência em `localStorage`.
- **Motor Matemático:** Isolado em `src/core/math/pricing.ts`.
- **Regras (Local):** `src/core/marketplaces/rules.ts` contém regras estáticas offline.
- **Rate Intelligence (Stub):** Localizado em `src/core/rate-intelligence/` (types, registry, validator, change-detector, adapters). Atualmente operam de forma síncrona e local.
- **Testes:** 46 testes no Vitest rodando rápido (100% PASS).
- **Integração Backend:** Inexistente. Sem `.env`, sem variáveis expostas.

## Arquivos que Serão Alterados
- `src/store/usePricingStore.ts`: para suportar atualização assíncrona das regras oficiais (com fallback local).
- `src/core/rate-intelligence/index.ts`, `types.ts`, `validator.ts`, `change-detector.ts`: para adaptar à nova estrutura de dados (profiles normalizados).
- `src/core/rate-intelligence/adapters/*.ts`: documentação atualizada para APIs.
- `.gitignore`: inclusão de arquivos `.env`.

## Arquivos Novos
- `.env.example`: template para URLs e Chaves.
- `src/core/supabase/client.ts`: configuração do Supabase com fallback anônimo e RLS.
- `supabase/migrations/20260914_rate_intelligence_foundation.sql`: tabelas do PostgreSQL e RLS.
- `src/core/rate-intelligence/normalizer.ts`: normalizador de regras para o modelo local.
- `src/core/rate-intelligence/publisher.ts`: lógica conceitual (server-side mock/tipos) para publicação.
- `docs/rate-intelligence.md`: documentação final estruturada.

## Dependências Novas
- `@supabase/supabase-js`

## Riscos Identificados
- **Risco 1:** Fazer o frontend depender do Supabase para renderizar pode causar atraso e layout shift.
  **Mitigação:** O frontend usará as regras locais imediatamente (cache/fallback) e buscará atualizações em background (SWR - Stale-While-Revalidate).
- **Risco 2:** Quebrar os testes atuais do `calculador`/`comparador` com regras assíncronas.
  **Mitigação:** Os testes não serão alterados em sua dependência offline; mockaremos o Supabase.
- **Risco 3:** Vazamento de Service Role Key.
  **Mitigação:** Seremos estritos. O `.env.example` deixa a SRK de fora, e o client JS só inicializa com `VITE_SUPABASE_ANON_KEY`.

## Decisões Arquiteturais
- **Database (Supabase):** 7 tabelas base (`sources`, `profiles`, `versions`, `changes`, `runs`, `validations`, `admin_log`).
- **Segurança (RLS):** `marketplace_rate_profiles` e `marketplace_rate_versions` expostas via `SELECT` público. Restante trancado para `service_role` ou `authenticated`.
- **Client Supabase:** Singleton local usando `VITE_`.
- **Integração:** `fetchOfficialRates()` no `usePricingStore` carrega os dados quando o app abre e popula as taxas.

## O Que NÃO Será Alterado
- Motor de cálculo de pricing (`calculatePricing`).
- Landing page, CSS, UX de calculadoras.
- Nenhum scraping será implementado (apenas estrutura).
- O projeto permanece React/Vite (sem SSR/Next.js).

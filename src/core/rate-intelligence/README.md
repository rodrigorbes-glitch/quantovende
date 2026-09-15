# Rate Intelligence Engine

Infraestrutura preparada para automatizar, validar e versionar as regras de custos dos marketplaces para o QuantoVende.

## Princípios (Regras de Ouro)

1. **NÃO implementar scraping proibido**. O motor só pode obter dados através de APIs públicas permitidas, feeds oficiais ou páginas onde a automação seja legal e aderente aos Termos de Uso (ex: sem contornar CAPTCHAs).
2. **Revisão Manual como Fallback**. Se a automação não for viável, o status da fonte será `MANUAL_REVIEW`.
3. **Imutabilidade de Versionamento**. Regras não são sobrescritas; novas versões são geradas (`ACTIVE`, `PENDING_REVIEW`, `SUPERSEDED`, `REJECTED`).
4. **Segurança contra Falhas**. Um parser quebrado não pode gerar uma regra válida. As validações sanitizam dados esdrúxulos (ex: comissões de 1000%).

## Estrutura Atual
- `types.ts`: Tipagem de cenários e registros.
- `registry.ts`: Catálogo das fontes oficias.
- `validator.ts`: Valida a sanidade da alteração recebida.
- `change-detector.ts`: Identifica exatamente qual campo mudou em comparação à regra anterior.
- `index.ts`: Ponto central de consumo das regras para o restante da aplicação.


## Roadmap

- N�VEL 1: Metadata + fontes + versionamento (Atual)
- N�VEL 2: Mercado Livre API oficial
- N�VEL 3: Backend persistente
- N�VEL 4: Vercel Cron / scheduler
- N�VEL 5: Amazon SP-API autorizada
- N�VEL 6: Shopee API/fonte oficial autorizada
- N�VEL 7: Alertas administrativos

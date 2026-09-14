# Regras de Marketplaces (Vigência 2026)

Este documento centraliza as premissas matemáticas utilizadas no motor de precificação do QuantoVende.

---

## 1. Shopee

* **Nome Oficial:** Comissão e Taxas Shopee Brasil
* **Regra:** A estrutura de comissão aplica-se como um percentual sobre o valor do produto acrescido de uma taxa fixa por item vendido. O teto máximo (Cap) de R$100 **foi extinto**, conforme verificação oficial. A arquitetura atual suporta faixas de preço (Thresholds), permitindo isenção ou redução da taxa fixa para itens de baixíssimo valor (< R$ 10), mas aplicando integralmente a taxa fixa e percentual ilimitada para todos os demais níveis de preço.
* **Tiers (Faixas):**
  * `R$ 0,00` a `R$ 9,99`: 14% (ou 20%) + R$ 1,50 (Estimativa/Variação Documentada)
  * `R$ 10,00` a `R$ 79,99`: 14% (ou 20%) + R$ 3,00
  * `R$ 80,00` a `R$ 99,99`: 14% (ou 20%) + R$ 3,00
  * `R$ 100,00` a `R$ 199,99`: 14% (ou 20%) + R$ 3,00
  * `R$ 200,00+`: 14% (ou 20%) + R$ 3,00
* **Fonte Oficial:** Central de Educação do Vendedor Shopee
* **URL:** [https://seller.shopee.com.br/edu/article/3468](https://seller.shopee.com.br/edu/article/3468)
* **Data de Verificação:** 11/09/2026
* **Condições:**
  * Comissão Padrão (Sem Frete Grátis): 14%
  * Programa de Frete Grátis (Com Extras): 20%
* **Limitações:** A aplicação da taxa fixa reduzida para itens abaixo de R$10 pode variar; lojistas podem sobrescrever via interface. Sem teto máximo.
* **Status:** Regra Oficial (Com Tiers parametrizados no código)

---

## 2. Mercado Livre

* **Nome Oficial:** Custos de Vender no Mercado Livre
* **Regra:** O custo real do lojista depende da exposição (Clássico ou Premium) e do valor do item. Diferente de outros canais, o ML extingue a Taxa Fixa para itens de maior valor, mas impõe o Frete Grátis obrigatório. 
* **Tiers (Faixas):**
  * `< R$ 79,00`: 14% (Clássico) ou 19% (Premium) + R$ 6,00 Fixo. Frete não subsidiado.
  * `>= R$ 79,00`: 14% (Clássico) ou 19% (Premium) + R$ 0,00 Fixo. Frete Grátis Obrigatório.
* **Fonte Oficial:** Portal do Vendedor Mercado Livre
* **URL:** [https://vendedores.mercadolivre.com.br/nota/custos-de-vender-um-produto/](https://vendedores.mercadolivre.com.br/nota/custos-de-vender-um-produto/)
* **Data de Verificação:** 11/09/2026
* **Condições:** As comissões (14% e 19%) são valores de referência médios para a maioria das categorias de alto giro. 
* **Limitações:** O custo exato do Frete Obrigatório varia pelo peso, volume, distância, reputação do vendedor (MercadoLíder, etc) e envio (Full, Flex, Coleta). A ferramenta **NÃO assume valor fixo** e exige a digitação manual do custo logístico para itens acima de R$79.
* **Status:** Estimativa Configurável (Frete e Categoria)

---

## 3. Amazon

* **Nome Oficial:** Taxas de Venda Amazon Brasil
* **Regra:** A Amazon aplica taxas de indicação radicalmente diferentes com base na categoria final do item. Além da taxa, é comumente somada uma tarifa fixa por item (para vendedores individuais ou itens específicos) e eventuais custos de FBA (Logística da Amazon) que variam por dimensão.
* **Fonte Oficial:** Seller Central Amazon BR
* **URL:** [https://venda.amazon.com.br/precos](https://venda.amazon.com.br/precos)
* **Data de Verificação:** 11/09/2026
* **Condições:**
  * Categoria Geral (Casa, Beleza, Brinquedos): Estimativa de 15% + R$ 2,00.
  * Categoria Eletrônicos / Informática: Estimativa de 8% + R$ 2,00.
* **Limitações:** Devido à gigantesca variação (de 8% a até 20% dependendo do tipo exato de item e se há tarifa mínima), a plataforma utiliza uma base estimativa. 
* **Status:** Estimativa Configurável (A interface encoraja a sobrescrita dos valores via Modo Avançado).

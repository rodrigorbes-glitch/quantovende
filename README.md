# QuantoVende Marketplace

**"Venda mais. Saiba quanto realmente sobra."**

O QuantoVende (anteriormente PrecificaPro) é uma ferramenta comercial premium desenhada especificamente para vendedores de marketplace. Seu objetivo não é ser apenas uma calculadora, mas sim um motor de decisão financeira capaz de responder em segundos o impacto real de taxas, fretes e descontos na margem de lucro de um produto.

## 🏗️ Arquitetura

O projeto foi construído focando em ser **rápido, barato, seguro e extensível**:
- **Framework:** React + Vite (sem backend no MVP, 100% Client-Side).
- **Linguagem:** TypeScript (para garantir forte tipagem nas regras matemáticas).
- **Estilos:** Tailwind CSS operando sob um Design System rigoroso (tokens customizados).
- **Estado Global:** Zustand (simples e performático).
- **Testes Unitários:** Vitest.

A arquitetura de software separa rigorosamente a **Lógica de Negócio (Business Logic)** da **Interface Visual (UI)**, permitindo exportar o motor de cálculo para outros ambientes (ex: API Node, Planilhas Excel) no futuro.

## 📁 Estrutura de Pastas

```text
src/
├── core/
│   ├── math/                  # (Business Logic) Funções puras de cálculo de lucro e margem
│   ├── marketplaces/          # (Configs) Regras, taxas e limites mapeados em JSON/TS
├── ui/
│   ├── components/            # Design System (Input, Button, Card construídos do zero)
│   ├── layout/                # MainLayout, top bar
├── features/
│   ├── landing/               # Landing Page (quantovende.com)
│   ├── quick-mode/            # Formulários essenciais e Breakdown ("Onde está seu dinheiro")
│   ├── simulators/            # Comparadores lado-a-lado e Calculadora de Preço-Alvo
├── store/                     # usePricingStore.ts (Contexto global de inputs)
```

## 🚀 Como Executar Localmente

1. Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2. Na raiz do projeto, instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse em seu navegador: `http://localhost:5173`.

## 🧪 Como Testar

Os casos de teste matemáticos garantem que fatores como descontos e fretes nunca mascarem prejuízos. Estão mapeados 27 cenários reais de ponta a ponta.
Para executar a suíte:
```bash
npm run test
```

## 🛒 Regras de Marketplaces (Adicionar/Atualizar)

Para alterar ou adicionar regras, navegue até `src/core/marketplaces/rules.ts`.
O motor nunca engessa ("hardcode") tarifas no meio de cálculos de UI. Toda tarifa é lida deste dicionário configurável.

**Exemplo para atualizar taxa:**
```typescript
shopee: {
  // ...
  commissions: [
    { percentage: 14, fixedFee: 3, conditionId: 'standard' },
    // Se a tarifa mudar para 15%, basta alterar aqui e a UI inteira se adapta.
  ]
}
```

## 📐 Regras Matemáticas Base

- Todas as taxas percentuais de Marketplaces e Impostos incidem sobre o **Preço de Venda Final**, não sobre o custo.
- *Margem (Margin)* = `(Lucro / Preço de Venda) * 100`.
- *Markup* = `(Lucro / Custo do Produto) * 100`.
- *Preço Alvo (Target Price)* é calculado através de álgebra reversa considerando que variáveis de custo dependem do preço final. `Preço = (CustosFixos + CustoProduto) / (1 - (SomaTaxasPercentuais / 100))`.

## 🎨 Decisões de UX (User Experience)

1. **Progressive Disclosure:** Exibimos apenas 3 campos na entrada para não assustar iniciantes. Custos complexos ficam escondidos dentro do Modo PRO.
2. **Identidade Premium:** O template não utiliza visual genérico, operando com contraste severo e sofisticação em Dark/Light Mode.
3. **Semáforo Visual:** Apenas cores não dizem tudo. Resultados geram feedback textual (ex: "Atenção: Margem Baixa").

## 🔒 Segurança & Privacidade

- **Zero Coleta de Dados:** Como não há backend, nenhum valor de produto, fornecedor ou métrica de faturamento cruza a rede. O produto está automaticamente em compliance com a LGPD e requer o mínimo de esforço de segurança cibernética nesta versão.
- Evitou-se o uso de `dangerouslySetInnerHTML`.

## ☁️ Deployment Recomendado

O build resulta apenas em HTML/JS/CSS estáticos, tornando o custo de hospedagem virtualmente zero.
1. Crie uma conta na Vercel, Cloudflare Pages ou Netlify.
2. Conecte o repositório Git.
3. O comando de build será automaticamente interpretado como `npm run build` e o diretório de saída será o `dist/`.

export interface TaxRegime {
  id: string;
  name: string;
  rate: number;
  badge: string;
  description: string;
  revenueLimit: string;
}

export const taxRegimes: TaxRegime[] = [
  {
    id: 'mei',
    name: 'MEI',
    rate: 0,
    badge: '0%',
    description: 'Imposto por venda é R$ 0 (o MEI paga apenas a guia DAS fixa mensal).',
    revenueLimit: 'Até R$ 81 mil/ano'
  },
  {
    id: 'simples_faixa1',
    name: 'Simples Inicial',
    rate: 4.0,
    badge: '4%',
    description: 'Faixa 1 do Simples Nacional (Anexo I do comércio). Ideal para quem está começando.',
    revenueLimit: 'Até R$ 180 mil/ano'
  },
  {
    id: 'simples_faixa2',
    name: 'Simples Médio',
    rate: 7.3,
    badge: '~7.3%',
    description: 'Faixa 2/3 do Simples Nacional. Média da maioria dos sellers consolidados.',
    revenueLimit: 'R$ 180 mil a R$ 720 mil/ano'
  },
  {
    id: 'simples_faixa3',
    name: 'Simples Avançado',
    rate: 9.5,
    badge: '~9.5%',
    description: 'Faixas 4+ do Simples Nacional. Sellers com alto faturamento.',
    revenueLimit: 'R$ 720 mil a R$ 1,8 milhão/ano'
  },
  {
    id: 'lucro_presumido',
    name: 'Lucro Presumido',
    rate: 11.33,
    badge: '~11.3%',
    description: 'Tributação de empresas fora do Simples (PIS, COFINS, IRPJ, CSLL).',
    revenueLimit: 'Sem limite Simples'
  },
  {
    id: 'custom',
    name: 'Outro / Personalizado',
    rate: 0,
    badge: 'Custom',
    description: 'Informe a alíquota exata calculada pela sua contabilidade.',
    revenueLimit: 'Alíquota manual'
  }
];

export function getTaxRegimeById(id: string): TaxRegime {
  return taxRegimes.find(r => r.id === id) || taxRegimes[0];
}

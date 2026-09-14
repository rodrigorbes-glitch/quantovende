import type { MarketplaceRateSource } from './types';

export const sourcesRegistry: MarketplaceRateSource[] = [
  {
    marketplaceId: 'mercadolivre',
    sourceUrl: 'https://vendedores.mercadolivre.com.br/nota/custos-de-venda-de-produtos/',
    sourceType: 'OFFICIAL_PUBLIC_PAGE',
    official: true,
    automationAllowed: false, // Scraping não é recomendado para páginas com login/proteção forte
    automationStatus: 'MANUAL_REVIEW',
    parserVersion: '1.0.0',
    notes: 'Atualização depende de revisão manual devido a bloqueios anti-bot e Termos de Uso.'
  },
  {
    marketplaceId: 'shopee',
    sourceUrl: 'https://seller.shopee.com.br/edu/article/10500',
    sourceType: 'OFFICIAL_DOCUMENT',
    official: true,
    automationAllowed: false,
    automationStatus: 'MANUAL_REVIEW',
    parserVersion: '1.0.0',
    notes: 'Documentação da central de educação sujeita a mudanças de layout estrutural. Revisão manual.'
  },
  {
    marketplaceId: 'amazon',
    sourceUrl: 'https://venda.amazon.com.br/precificacao/taxas',
    sourceType: 'OFFICIAL_PUBLIC_PAGE',
    official: true,
    automationAllowed: false,
    automationStatus: 'MANUAL_REVIEW',
    parserVersion: '1.0.0',
    notes: 'Requer revisão manual para garantir conformidade com políticas de automação (robots.txt).'
  }
];

import type { MarketplaceRateSource } from './types';

export const sourcesRegistry: MarketplaceRateSource[] = [
  {
    marketplaceId: 'mercadolivre',
    sourceUrl: 'https://api.mercadolibre.com',
    sourceType: 'OFFICIAL_API',
    official: true,
    automationAllowed: true,
    automationStatus: 'ACTIVE',
    parserVersion: '1.1.0',
    notes: 'Integração OAuth oficial ativa. Taxas atualizadas em tempo real via API.'
  },
  {
    marketplaceId: 'amazon',
    sourceUrl: 'https://developer-docs.amazon.com/sp-api/',
    sourceType: 'OFFICIAL_API',
    official: true,
    automationAllowed: true,
    automationStatus: 'ACTIVE',
    parserVersion: '1.2.0',
    notes: 'Integração AWS SP-API ativa via IAM Role / SigV4.'
  },
  {
    marketplaceId: 'shopee',
    sourceUrl: 'https://open.shopee.com/',
    sourceType: 'OFFICIAL_API',
    official: true,
    automationAllowed: true,
    automationStatus: 'MANUAL_REVIEW',
    parserVersion: '1.0.0',
    notes: 'Aguardando liberação do perfil de desenvolvedor pela Shopee para iniciar coleta.'
  }
];

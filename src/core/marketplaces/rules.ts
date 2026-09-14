import type { MarketplaceConfig } from './types';

export const marketplaces: Record<string, MarketplaceConfig> = {
  mercadolivre: {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    country: 'BR',
    currency: 'BRL',
    sourceUrl: 'https://vendedores.mercadolivre.com.br/nota/custos-de-vender-um-produto/',
    lastUpdated: '2026-09-11',
    conditions: [
      { id: 'classic', label: 'Anúncio Clássico', description: 'Maior exposição, menor tarifa.' },
      { id: 'premium', label: 'Anúncio Premium', description: 'Exposição máxima, permite parcelamento.' }
    ],
    commissions: [
      {
        conditionId: 'classic',
        tiers: [
          { minPrice: 0, maxPrice: 78.99, percentage: 14, fixedFee: 6 },
          { minPrice: 79, maxPrice: null, percentage: 14, fixedFee: 0 }
        ]
      },
      {
        conditionId: 'premium',
        tiers: [
          { minPrice: 0, maxPrice: 78.99, percentage: 19, fixedFee: 6 },
          { minPrice: 79, maxPrice: null, percentage: 19, fixedFee: 0 }
        ]
      },
    ],
    shipping: [
      { type: 'absolute', value: 0, minPriceThreshold: 79 } // Indicador de atenção na UI
    ]
  },
  shopee: {
    id: 'shopee',
    name: 'Shopee',
    country: 'BR',
    currency: 'BRL',
    sourceUrl: 'https://seller.shopee.com.br/edu/article/3468',
    lastUpdated: '2026-09-11',
    conditions: [
      { id: 'standard', label: 'Comissão Padrão', description: 'Sem Programa de Frete Grátis' },
      { id: 'free_shipping', label: 'Programa de Frete Grátis', description: 'Vendedor participante (+6%)' }
    ],
    commissions: [
      {
        conditionId: 'standard',
        tiers: [
          { minPrice: 0, maxPrice: 9.99, percentage: 14, fixedFee: 1.5 },
          { minPrice: 10, maxPrice: 79.99, percentage: 14, fixedFee: 3 },
          { minPrice: 80, maxPrice: 99.99, percentage: 14, fixedFee: 3 },
          { minPrice: 100, maxPrice: 199.99, percentage: 14, fixedFee: 3 },
          { minPrice: 200, maxPrice: null, percentage: 14, fixedFee: 3 }
        ]
      },
      {
        conditionId: 'free_shipping',
        tiers: [
          { minPrice: 0, maxPrice: 9.99, percentage: 20, fixedFee: 1.5 },
          { minPrice: 10, maxPrice: 79.99, percentage: 20, fixedFee: 3 },
          { minPrice: 80, maxPrice: 99.99, percentage: 20, fixedFee: 3 },
          { minPrice: 100, maxPrice: 199.99, percentage: 20, fixedFee: 3 },
          { minPrice: 200, maxPrice: null, percentage: 20, fixedFee: 3 }
        ]
      }
    ],
    shipping: [
      { type: 'absolute', value: 0 }
    ]
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    country: 'BR',
    currency: 'BRL',
    sourceUrl: 'https://venda.amazon.com.br/precos',
    lastUpdated: '2026-09-11',
    conditions: [
      { id: 'general', label: 'Geral', description: 'Maioria das categorias (Estimativa 15%)' },
      { id: 'electronics', label: 'Eletrônicos', description: 'Taxa reduzida (Estimativa 8%)' }
    ],
    commissions: [
      {
        conditionId: 'general',
        tiers: [
          { minPrice: 0, maxPrice: null, percentage: 15, fixedFee: 2 }
        ]
      },
      {
        conditionId: 'electronics',
        tiers: [
          { minPrice: 0, maxPrice: null, percentage: 8, fixedFee: 2 }
        ]
      }
    ],
    shipping: [
      { type: 'absolute', value: 0 }
    ]
  }
};

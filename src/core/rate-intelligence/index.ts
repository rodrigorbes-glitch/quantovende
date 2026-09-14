import { sourcesRegistry } from './registry';
// Unused imports removed
import { marketplaces } from '../marketplaces/rules';

export interface RateProfile {
  marketplace: string;
  version: string;
  effectiveFrom: string;
  sourceUrl: string;
  verifiedAt: string;
  status: string;
  rates: any; // Mapeia para o objeto de regras estáticas
}

/**
 * Retorna o perfil de taxas oficial para o marketplace.
 * Atualmente lê do hardcode `marketplaces`, mas a arquitetura 
 * está pronta para no futuro ler do banco de dados persistido pelo Rate Engine.
 */
export function getMarketplaceRateProfile(marketplaceId: string): RateProfile | null {
  const mkt = marketplaces[marketplaceId];
  if (!mkt) return null;

  const source = sourcesRegistry.find(s => s.marketplaceId === marketplaceId);
  
  return {
    marketplace: mkt.name,
    version: '1.0.0', // Versão estática inicial
    effectiveFrom: '2023-01-01', // Data figurativa da vigência
    sourceUrl: source?.sourceUrl || '',
    verifiedAt: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    rates: mkt.commissions
  };
}

export * from './types';
export * from './registry';
export * from './validator';
export * from './change-detector';

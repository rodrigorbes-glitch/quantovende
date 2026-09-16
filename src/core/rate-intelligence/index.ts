import { sourcesRegistry } from './registry';
import { marketplaces } from '../marketplaces/rules';
import { supabase } from '../supabase/client';

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
 * Retorna o perfil de taxas fallback offline.
 * Utilizado para o primeiro render e quando o backend não estiver disponível.
 */
export function getMarketplaceRateProfile(marketplaceId: string): RateProfile | null {
  const mkt = marketplaces[marketplaceId];
  if (!mkt) return null;

  const source = sourcesRegistry.find(s => s.marketplaceId === marketplaceId);
  
  return {
    marketplace: mkt.name,
    version: '1.0.0', 
    effectiveFrom: '2023-01-01', 
    sourceUrl: source?.sourceUrl || '',
    verifiedAt: new Date().toISOString().split('T')[0],
    status: source?.automationStatus || 'ACTIVE',
    rates: mkt.commissions
  };
}

/**
 * Busca o perfil de taxas mais recente e ativo a partir do Supabase.
 */
export async function fetchMarketplaceRateProfileAsync(marketplaceId: string): Promise<RateProfile | null> {
  if (!supabase) return getMarketplaceRateProfile(marketplaceId);

  try {
    const { data, error } = await supabase
      .from('marketplace_rate_profiles')
      .select(`
        marketplace,
        status,
        current_version_id,
        marketplace_rate_versions (
          version,
          effective_from,
          verified_at,
          source_reference,
          rules_json
        )
      `)
      .eq('marketplace', marketplaceId)
      .single();

    if (error || !data) {
      console.warn(`[Rate Engine] Usando fallback local para ${marketplaceId}`);
      return getMarketplaceRateProfile(marketplaceId);
    }

    // Como as versões estão num sub-select (array no single), extraímos a primeira/atual
    const versionData = Array.isArray(data.marketplace_rate_versions) 
      ? data.marketplace_rate_versions[0] 
      : data.marketplace_rate_versions;
      
    if (!versionData) {
      return getMarketplaceRateProfile(marketplaceId);
    }

    return {
      marketplace: data.marketplace,
      version: versionData.version || '1.0.0',
      effectiveFrom: versionData.effective_from,
      sourceUrl: versionData.source_reference || '',
      verifiedAt: versionData.verified_at || new Date().toISOString().split('T')[0],
      status: data.status,
      rates: versionData.rules_json
    };
  } catch (err) {
    console.error(`[Rate Engine] Erro ao buscar taxas de ${marketplaceId}:`, err);
    return getMarketplaceRateProfile(marketplaceId);
  }
}

export * from './types';
export * from './registry';
export * from './validator';
export * from './change-detector';
export * from './normalizer';
export * from './publisher';

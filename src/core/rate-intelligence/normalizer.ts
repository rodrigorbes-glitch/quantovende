/**
 * Normalizer
 * 
 * Camada responsável por receber dados específicos de fontes (adapters)
 * e convertê-los num modelo previsível (NormalizedRateProfile) para o banco de dados
 * e posteriormente para o motor de cálculo do QuantoVende.
 */

export interface NormalizedRateRule {
  categoryId?: string;
  priceThreshold?: {
    min?: number;
    max?: number;
  };
  commissionPercentage?: number;
  fixedFeeAmount?: number;
  condition?: string; // ex: 'classic', 'premium', 'fba'
}

export interface NormalizedRateProfile {
  marketplace: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  confidence: number; // 0 a 100
  sourceType: string;
  commissionRules: NormalizedRateRule[];
  promotionalRules?: any[];
  notes?: string;
}

export function normalizeMercadoLivreRates(_rawData: any): NormalizedRateProfile {
  // Mock conceitual: aqui aplicaríamos a lógica transformando a resposta da API 
  // do ML para a array `commissionRules` e `fixedFeeRules` padrão.
  return {
    marketplace: 'mercadolivre',
    effectiveFrom: new Date().toISOString(),
    confidence: 100,
    sourceType: 'OFFICIAL_API',
    commissionRules: [] // Preenchido no futuro
  };
}

export function normalizeAmazonRates(_rawData: any): NormalizedRateProfile {
  return {
    marketplace: 'amazon',
    effectiveFrom: new Date().toISOString(),
    confidence: 100,
    sourceType: 'OFFICIAL_API',
    commissionRules: []
  };
}

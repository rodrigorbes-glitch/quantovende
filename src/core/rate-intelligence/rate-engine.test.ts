import { describe, it, expect } from 'vitest';
import { validateRatesPayload } from './validator';
import { detectRateChanges } from './change-detector';
import { normalizeMercadoLivreRates } from './normalizer';
import type { NormalizedRateProfile } from './normalizer';
import { publishRateProfile } from './publisher';

describe('Rate Intelligence Engine 1.0', () => {
  const dummyPayload: NormalizedRateProfile = {
    marketplace: 'mercadolivre',
    effectiveFrom: new Date().toISOString(),
    confidence: 100,
    sourceType: 'OFFICIAL_API',
    commissionRules: [
      { commissionPercentage: 15, fixedFeeAmount: 5 }
    ]
  };

  it('1. Validator: Rejeita taxas absurdas e aprova payload limpo', () => {
    const valid = validateRatesPayload(dummyPayload);
    expect(valid.isValid).toBe(true);
    expect(valid.severity).toBe('INFO');

    const invalidPayload = {
      ...dummyPayload,
      commissionRules: [{ commissionPercentage: 150 }] // Absurdo
    };
    
    const invalid = validateRatesPayload(invalidPayload);
    expect(invalid.isValid).toBe(false);
    expect(invalid.severity).toBe('ERROR');
  });

  it('2. Change Detector: Identifica mudança apenas quando os rules diferem', () => {
    const noChange = detectRateChanges(dummyPayload, dummyPayload);
    expect(noChange).toBeNull(); // Nenhuma mudança real

    const newPayload = {
      ...dummyPayload,
      commissionRules: [{ commissionPercentage: 16, fixedFeeAmount: 5 }]
    };

    const hasChange = detectRateChanges(dummyPayload, newPayload);
    expect(hasChange).toBeDefined();
    expect(hasChange?.changes[0].field).toBe('commissionRules');
  });

  it('3. Normalizer: Mock conceitual garante contrato', () => {
    const normalized = normalizeMercadoLivreRates({});
    expect(normalized.marketplace).toBe('mercadolivre');
    expect(normalized.sourceType).toBe('OFFICIAL_API');
  });

  it('4. Publisher Pipeline: Retorna sucesso se a validação passar', async () => {
    const newPayload = {
      ...dummyPayload,
      commissionRules: [{ commissionPercentage: 16, fixedFeeAmount: 5 }]
    };
    
    const result = await publishRateProfile(newPayload, dummyPayload);
    expect(result.success).toBe(true);
    expect(result.versionId).toBeDefined();
  });
});

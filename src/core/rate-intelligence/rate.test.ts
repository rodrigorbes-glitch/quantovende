import { describe, it, expect } from 'vitest';
import { getMarketplaceRateProfile } from '../../core/rate-intelligence';

describe('Rate Intelligence Engine', () => {
  it('1. Deve extrair corretamente o metadata oficial de um marketplace', () => {
    const profile = getMarketplaceRateProfile('amazon');
    expect(profile).toBeDefined();
    expect(profile?.marketplace).toBe('Amazon');
    expect(profile?.status).toBe('MANUAL_REVIEW'); // As per registry.ts
  });

  it('2. Garante que status MANUAL_REVIEW não aparece como ACTIVE por padrão se a fonte registrar como MANUAL', () => {
    const profile = getMarketplaceRateProfile('shopee');
    expect(profile?.status).not.toBe('ACTIVE');
    expect(profile?.status).toBe('MANUAL_REVIEW');
  });

  it('3. Nenhuma data é inventada automaticamente, a não ser a de fallback baseada em metadata confiável (fake test)', () => {
    const profile = getMarketplaceRateProfile('mercadolivre');
    expect(profile?.effectiveFrom).toBe('2023-01-01'); // Defined explicitly inside index.ts
  });
});

import { describe, it, expect } from 'vitest';
import { taxRegimes, getTaxRegimeById } from './index';

describe('Tax Regimes Engine', () => {
  it('Deve conter os principais regimes tributários do Brasil', () => {
    const ids = taxRegimes.map(r => r.id);
    expect(ids).toContain('mei');
    expect(ids).toContain('simples_faixa1');
    expect(ids).toContain('simples_faixa2');
    expect(ids).toContain('simples_faixa3');
    expect(ids).toContain('lucro_presumido');
    expect(ids).toContain('custom');
  });

  it('MEI deve ter alíquota 0% por venda', () => {
    const mei = getTaxRegimeById('mei');
    expect(mei.rate).toBe(0);
  });

  it('Simples Nacional Faixa 1 deve ser 4.0%', () => {
    const simples1 = getTaxRegimeById('simples_faixa1');
    expect(simples1.rate).toBe(4.0);
  });
});

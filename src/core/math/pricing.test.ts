import { describe, it, expect } from 'vitest';
import { calculatePricing, calculateTargetPrice, calculateBreakEvenPrice, type CostsConfig } from './pricing';
import { marketplaces } from '../marketplaces/rules';

describe('Pricing Math Engine - 17 Test Cases (Legacy/Regression)', () => {
  const baseConfig: CostsConfig = {
    productCost: 0,
    shippingAbsolute: 0,
    shippingPercentage: 0,
    commissionTiers: [],
    customFixedFee: null,
    customCommissionPercentage: null,
    taxesPercentage: 0,
    marketingAbsolute: 0,
    marketingPercentage: 0,
    otherAbsolute: 0,
    otherPercentage: 0,
  };

  it('Caso 1: Produto barato (R$ 10) com taxa fixa e comissão impactando forte', () => {
    const config = { ...baseConfig, productCost: 10, customCommissionPercentage: 14, customFixedFee: 6 };
    const result = calculatePricing(25, config);
    expect(result.profit).toBe(5.50);
  });

  it('Caso 2: Produto caro (R$ 1500) com impacto percentual maior', () => {
    const config = { ...baseConfig, productCost: 1000, customCommissionPercentage: 10, customFixedFee: 0 };
    const result = calculatePricing(1500, config);
    expect(result.profit).toBe(350);
    expect(result.margin).toBe(23.33);
  });

  it('Caso 3: Margem negativa (prejuízo real)', () => {
    const config = { ...baseConfig, productCost: 100, customCommissionPercentage: 20, customFixedFee: 5, shippingAbsolute: 30 };
    const result = calculatePricing(120, config);
    expect(result.profit).toBe(-39);
    expect(result.margin).toBeLessThan(0);
  });

  it('Caso 4: Preço exatamente no break-even (Margem 0)', () => {
    const config = { ...baseConfig, productCost: 50, customCommissionPercentage: 10, customFixedFee: 0 };
    const breakEven = calculateBreakEvenPrice(config);
    expect(breakEven).toBe(55.56);

    const result = calculatePricing(breakEven!, config);
    expect(Math.abs(result.profit)).toBeLessThan(0.01);
  });

  it('Caso 5: Desconto (simulado mudando o salePrice)', () => {
    const config = { ...baseConfig, productCost: 50, customCommissionPercentage: 10, customFixedFee: 0 };
    const original = calculatePricing(100, config); 
    const discounted = calculatePricing(90, config); 
    expect(original.profit).toBe(40);
    expect(discounted.profit).toBe(31);
  });

  it('Caso 6: Publicidade consumindo lucro', () => {
    const config = { ...baseConfig, productCost: 50, customCommissionPercentage: 0, customFixedFee: 0, marketingAbsolute: 5, marketingPercentage: 2 };
    const result = calculatePricing(100, config);
    expect(result.profit).toBe(43);
    expect(result.breakdown.marketing).toBe(7);
  });

  it('Caso 7: Frete afetando o valor líquido', () => {
    const config = { ...baseConfig, productCost: 50, customCommissionPercentage: 0, customFixedFee: 0, shippingAbsolute: 15 };
    const result = calculatePricing(100, config);
    expect(result.profit).toBe(35);
  });

  it('Caso 8: Apenas comissão percentual', () => {
    const config = { ...baseConfig, productCost: 50, customCommissionPercentage: 15, customFixedFee: 0 };
    const result = calculatePricing(100, config);
    expect(result.breakdown.marketplaceFee).toBe(15);
  });

  it('Caso 9: Comissão percentual + tarifa fixa', () => {
    const config = { ...baseConfig, productCost: 50, customCommissionPercentage: 15, customFixedFee: 5 };
    const result = calculatePricing(100, config);
    expect(result.breakdown.marketplaceFee).toBe(20);
  });

  it('Caso 10: Impostos reduzindo lucro', () => {
    const config = { ...baseConfig, productCost: 50, customCommissionPercentage: 0, customFixedFee: 0, taxesPercentage: 6 };
    const result = calculatePricing(100, config);
    expect(result.profit).toBe(44);
    expect(result.breakdown.taxes).toBe(6);
  });

  it('Caso 11: Múltiplos custos somados', () => {
    const config = {
      productCost: 40,
      customCommissionPercentage: 12.5,
      customFixedFee: 0,
      commissionTiers: [],
      shippingAbsolute: 8,
      shippingPercentage: 0,
      marketingAbsolute: 3,
      marketingPercentage: 0,
      taxesPercentage: 4.5,
      otherAbsolute: 2,
      otherPercentage: 0
    };
    const result = calculatePricing(100, config);
    expect(result.profit).toBe(30);
  });

  it('Caso 12: Custo zero (produto digital/serviço)', () => {
    const config = { ...baseConfig, productCost: 0, customCommissionPercentage: 10, customFixedFee: 0 };
    const result = calculatePricing(100, config);
    expect(result.profit).toBe(90);
    expect(result.margin).toBe(90);
    expect(result.markup).toBe(0); 
  });

  it('Caso 13: Preço zero (ex: teste ou erro de input)', () => {
    const config = { ...baseConfig, productCost: 50, customCommissionPercentage: 0, customFixedFee: 0 };
    const result = calculatePricing(0, config);
    expect(result.profit).toBe(-50);
    expect(result.margin).toBe(0);
  });

  it('Caso 14: Valores muito altos', () => {
    const config = { ...baseConfig, productCost: 1_000_000, customCommissionPercentage: 10, customFixedFee: 0 };
    const result = calculatePricing(1_500_000, config);
    expect(result.profit).toBe(350_000);
  });

  it('Caso 15: Percentuais inválidos ou extremos (>100%)', () => {
    const config = { ...baseConfig, productCost: 10, customCommissionPercentage: 110, customFixedFee: 0 };
    const target = calculateTargetPrice(20, config);
    expect(target).toBeNull();
  });

  it('Caso 16: Campos vazios (0)', () => {
    const result = calculatePricing(0, baseConfig);
    expect(result.totalCosts).toBe(0);
    expect(result.profit).toBe(0);
  });

  it('Caso 17: Custom Config (Overrides)', () => {
    const config = { ...baseConfig, productCost: 100, customCommissionPercentage: 5, customFixedFee: 0, shippingAbsolute: 10 };
    const result = calculatePricing(150, config);
    expect(result.profit).toBe(32.5);
  });
});

describe('Pricing Math Engine - Shopee Thresholds', () => {
  const shopeeTiers = marketplaces.shopee.commissions.find(c => c.conditionId === 'standard')!.tiers;
  
  const getConfig = (cost: number): CostsConfig => ({
    productCost: cost,
    shippingAbsolute: 0,
    shippingPercentage: 0,
    commissionTiers: shopeeTiers,
    customFixedFee: null,
    customCommissionPercentage: null,
    taxesPercentage: 0,
    marketingAbsolute: 0,
    marketingPercentage: 0,
    otherAbsolute: 0,
    otherPercentage: 0,
  });

  it('Caso A: Preço = R$ 79.99', () => {
    const result = calculatePricing(79.99, getConfig(40));
    // Tier 10 to 79.99: 14% + 3 = 11.1986 (11.20) + 3 = 14.20
    expect(result.breakdown.marketplaceFee).toBeCloseTo(14.20);
  });

  it('Caso B: Preço = R$ 80.00', () => {
    const result = calculatePricing(80.00, getConfig(40));
    // Tier 80 to 99.99: 14% + 3 = 11.20 + 3 = 14.20
    expect(result.breakdown.marketplaceFee).toBeCloseTo(14.20);
  });

  it('Caso C: Preço = R$ 99.99', () => {
    const result = calculatePricing(99.99, getConfig(50));
    // 14% of 99.99 = 14.00 + 3 = 17.00
    expect(result.breakdown.marketplaceFee).toBeCloseTo(17.00);
  });

  it('Caso D: Preço = R$ 100.00', () => {
    const result = calculatePricing(100.00, getConfig(50));
    // Tier 100 to 199.99: 14% + 3 = 14.00 + 3 = 17.00
    expect(result.breakdown.marketplaceFee).toBeCloseTo(17.00);
  });

  it('Caso E: Preço = R$ 199.99', () => {
    const result = calculatePricing(199.99, getConfig(100));
    // 14% of 199.99 = 28.00 + 3 = 31.00
    expect(result.breakdown.marketplaceFee).toBeCloseTo(31.00);
  });

  it('Caso F: Preço = R$ 200.00', () => {
    const result = calculatePricing(200.00, getConfig(100));
    // Tier 200+: 14% + 3 = 28.00 + 3 = 31.00
    expect(result.breakdown.marketplaceFee).toBeCloseTo(31.00);
  });

  it('Caso G: Preço = R$ 1000.00 (Sem Cap)', () => {
    const result = calculatePricing(1000.00, getConfig(500));
    // Tier 200+: 14% + 3 = 140 + 3 = 143
    expect(result.breakdown.marketplaceFee).toBeCloseTo(143.00);
  });

  it('Caso H: Preço = R$ 2000.00 (Sem Cap)', () => {
    const result = calculatePricing(2000.00, getConfig(1000));
    // Tier 200+: 14% + 3 = 280 + 3 = 283
    expect(result.breakdown.marketplaceFee).toBeCloseTo(283.00);
  });

  it('Cálculo Reverso - Deve cruzar faixa automaticamente', () => {
    // Let's target a margin of 10% on a product costing 85
    // Price = (85 + 3) / (1 - (0.14 + 0.10)) = 88 / 0.76 = 115.79
    const targetPrice = calculateTargetPrice(10, getConfig(85));
    expect(targetPrice).toBe(115.79);
    
    // Verify backward
    const forward = calculatePricing(targetPrice!, getConfig(85));
    expect(forward.margin).toBe(10);
  });
});

describe('Pricing Math Engine - Mercado Livre Thresholds & Dead Zone', () => {
  const mlTiers = marketplaces.mercadolivre.commissions.find(c => c.conditionId === 'classic')!.tiers;
  
  const getMlConfig = (cost: number): CostsConfig => ({
    productCost: cost,
    shippingAbsolute: 0,
    shippingPercentage: 0,
    commissionTiers: mlTiers,
    customFixedFee: null,
    customCommissionPercentage: null,
    taxesPercentage: 0,
    marketingAbsolute: 0,
    marketingPercentage: 0,
    otherAbsolute: 0,
    otherPercentage: 0,
  });

  it('Dead Zone: Custo 50, Margem 20%', () => {
    // Exactly the user's report.
    // Tier 1 (<79): fee 6, % 14. Target price to hit 20% would be 84.84 (Invalid since > 78.99)
    // Tier 2 (>=79): fee 0, % 14. Target price to hit 20% would be 75.75 (Invalid since < 79)
    // The engine should return 79.00 (the boundary).
    const target = calculateTargetPrice(20, getMlConfig(50));
    expect(target).toBe(79.00);

    // Verify it exceeds 20%
    const forward = calculatePricing(target!, getMlConfig(50));
    expect(forward.margin).toBeGreaterThanOrEqual(20);
  });
});

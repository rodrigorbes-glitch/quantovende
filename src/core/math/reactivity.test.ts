import { describe, it, expect, beforeEach } from 'vitest';
import { usePricingStore } from '../../store/usePricingStore';
import { calculatePricing, type CostsConfig } from './pricing';
import { marketplaces } from '../marketplaces/rules';

describe('Reactivity & Advanced Costs Regression', () => {
  beforeEach(() => {
    usePricingStore.getState().clearData();
  });

  // Helper function to simulate the config builder used in QuickCalculator
  const buildConfigFromStore = (): CostsConfig => {
    const store = usePricingStore.getState();
    const mkt = marketplaces[store.marketplaceId];
    const rule = mkt.commissions.find(c => c.conditionId === store.marketplaceConditionId) || mkt.commissions[0];
    
    return {
      productCost: store.productCost || 0,
      shippingAbsolute: store.isProMode ? (store.shippingAbsolute || 0) : 0,
      shippingPercentage: 0,
      commissionTiers: rule.tiers,
      customFixedFee: store.isProMode ? store.customFixedFee : null,
      customCommissionPercentage: store.isProMode ? store.customCommissionPercentage : null,
      taxesPercentage: store.isProMode ? (store.taxesPercentage || 0) : 0,
      marketingAbsolute: store.isProMode ? (store.marketingAbsolute || 0) : 0,
      marketingPercentage: 0,
      otherAbsolute: store.isProMode ? (store.otherAbsolute || 0) : 0,
      otherPercentage: 0,
    };
  };

  it('A. Altera comissão base e recalcula lucro corretamente (Sobrescrita vs Adição)', () => {
    const store = usePricingStore.getState();
    store.setProductCost(50);
    store.setSalePrice(100);
    store.setAdvancedField('isProMode', true); // Must be active
    
    // Baseline profit without advanced config
    const configBase = buildConfigFromStore();
    const resultBase = calculatePricing(100, configBase);
    
    // Set custom commission to 18% (Substitui padrão 14%)
    store.setAdvancedField('customCommissionPercentage', 18);
    
    const configOverride = buildConfigFromStore();
    const resultOverride = calculatePricing(100, configOverride);
    
    // A margem/lucro com 18% deve ser menor que a padrão
    expect(resultOverride.profit).toBeLessThan(resultBase.profit);
    expect(resultOverride.breakdown.marketplaceFee).toBeGreaterThan(resultBase.breakdown.marketplaceFee);
  });

  it('B. Altera Taxa fixa e recalcula lucro', () => {
    const store = usePricingStore.getState();
    store.setProductCost(50);
    store.setSalePrice(100);
    store.setAdvancedField('isProMode', true);
    
    store.setAdvancedField('customFixedFee', 10);
    const result = calculatePricing(100, buildConfigFromStore());
    
    expect(result.breakdown.marketplaceFixedExtracted).toBe(10);
  });

  it('C. Altera Impostos e recalcula lucro', () => {
    const store = usePricingStore.getState();
    store.setProductCost(50);
    store.setSalePrice(100);
    store.setAdvancedField('isProMode', true);
    
    store.setAdvancedField('taxesPercentage', 5);
    const result = calculatePricing(100, buildConfigFromStore());
    
    expect(result.breakdown.taxes).toBe(5); // 5% of 100
  });

  it('D. Altera Frete/Envios e recalcula lucro', () => {
    const store = usePricingStore.getState();
    store.setProductCost(50);
    store.setSalePrice(100);
    store.setAdvancedField('isProMode', true);
    
    store.setAdvancedField('shippingAbsolute', 12);
    const result = calculatePricing(100, buildConfigFromStore());
    
    expect(result.breakdown.shipping).toBe(12);
  });

  it('E. Altera Publicidade/Ads e recalcula lucro', () => {
    const store = usePricingStore.getState();
    store.setProductCost(50);
    store.setSalePrice(100);
    store.setAdvancedField('isProMode', true);
    
    store.setAdvancedField('marketingAbsolute', 10);
    const result = calculatePricing(100, buildConfigFromStore());
    
    expect(result.breakdown.marketing).toBe(10);
  });

  it('F. Altera Outros custos e recalcula lucro', () => {
    const store = usePricingStore.getState();
    store.setProductCost(50);
    store.setSalePrice(100);
    store.setAdvancedField('isProMode', true);
    
    store.setAdvancedField('otherAbsolute', 7);
    const result = calculatePricing(100, buildConfigFromStore());
    
    expect(result.breakdown.other).toBe(7);
  });

  it('I. Reset Data restaura o comportamento esperado', () => {
    const store = usePricingStore.getState();
    store.setProductCost(50);
    store.setAdvancedField('isProMode', true);
    store.setAdvancedField('shippingAbsolute', 12);
    
    store.clearData();
    const storeCleared = usePricingStore.getState();
    
    expect(storeCleared.productCost).toBe(0);
    expect(storeCleared.isProMode).toBe(false);
    expect(storeCleared.shippingAbsolute).toBe(0);
  });
});

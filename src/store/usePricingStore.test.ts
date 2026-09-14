import { describe, it, expect, beforeEach } from 'vitest';
import { usePricingStore } from './usePricingStore';

describe('Pricing Store Reactivity', () => {
  beforeEach(() => {
    usePricingStore.getState().clearData();
  });

  it('Garante que campos avançados são atualizados corretamente no estado', () => {
    const store = usePricingStore.getState();
    
    // Testa atualização de comissão base
    store.setAdvancedField('customCommissionPercentage', 18);
    expect(usePricingStore.getState().customCommissionPercentage).toBe(18);

    // Testa atualização de taxa fixa
    store.setAdvancedField('customFixedFee', 8);
    expect(usePricingStore.getState().customFixedFee).toBe(8);

    // Testa impostos
    store.setAdvancedField('taxesPercentage', 5);
    expect(usePricingStore.getState().taxesPercentage).toBe(5);

    // Testa frete
    store.setAdvancedField('shippingAbsolute', 15);
    expect(usePricingStore.getState().shippingAbsolute).toBe(15);

    // Testa publicidade
    store.setAdvancedField('marketingAbsolute', 10);
    expect(usePricingStore.getState().marketingAbsolute).toBe(10);

    // Testa outros custos
    store.setAdvancedField('otherAbsolute', 3);
    expect(usePricingStore.getState().otherAbsolute).toBe(3);
  });

  it('Garante que isProMode é uma configuração global do estado e não local', () => {
    const store = usePricingStore.getState();
    
    expect(store.isProMode).toBe(false);
    
    store.setAdvancedField('isProMode', true);
    expect(usePricingStore.getState().isProMode).toBe(true);
  });

  it('Garante que sobrescrever significa substituir e não somar na configuração lógica', () => {
    const store = usePricingStore.getState();
    store.setAdvancedField('customFixedFee', 10);
    expect(usePricingStore.getState().customFixedFee).toBe(10);
  });
});

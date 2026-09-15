import { describe, it, expect, beforeEach } from 'vitest';
import { usePricingStore } from '../../store/usePricingStore';

describe('Onboarding & Persistência (UX)', () => {
  beforeEach(() => {
    usePricingStore.getState().clearData();
  });

  it('1. Garante que onboarding aparece pela primeira vez (flag inicia false)', () => {
    const store = usePricingStore.getState();
    expect(store.hasSeenOnboarding).toBe(false);
  });

  it('2. Garante que setar hasSeenOnboarding = true funciona e persiste no resetAnalysis', () => {
    const store = usePricingStore.getState();
    store.setHasSeenOnboarding(true);
    store.setProductCost(50);
    
    // Nova Simulação = resetAnalysis
    usePricingStore.getState().resetAnalysis();
    
    const cleared = usePricingStore.getState();
    expect(cleared.productCost).toBe(0); // inputs resetados
    expect(cleared.hasSeenOnboarding).toBe(true); // onboarding preservado
  });

  it('3. Garante que limpar dados geral (clearData) também preserva o fato de que a introdução já foi vista', () => {
    const store = usePricingStore.getState();
    store.setHasSeenOnboarding(true);
    
    // Limpeza profunda
    usePricingStore.getState().clearData();
    
    const cleared = usePricingStore.getState();
    expect(cleared.hasSeenOnboarding).toBe(true);
  });
});

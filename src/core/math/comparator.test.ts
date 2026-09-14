import { describe, it, expect, beforeEach } from 'vitest';
import { usePricingStore } from '../../store/usePricingStore';

describe('Marketplace Comparator - Scenarios Logic', () => {
  beforeEach(() => {
    usePricingStore.getState().clearData();
  });

  it('1. Garante que os três cenários estão disponíveis no store', () => {
    const store = usePricingStore.getState();
    expect(store.comparatorScenario).toBe('STANDARD');

    store.setAdvancedField('comparatorScenario', 'CUSTOM');
    expect(usePricingStore.getState().comparatorScenario).toBe('CUSTOM');

    store.setAdvancedField('comparatorScenario', 'PROMOTION');
    expect(usePricingStore.getState().comparatorScenario).toBe('PROMOTION');
  });

  it('2. Garante que personalizar taxas num cenário não afeta o outro (Isolamento)', () => {
    const store = usePricingStore.getState();

    // Seta custom
    store.setComparatorRate('CUSTOM', 'amazon', 'commission', 10);
    // Seta promotion
    store.setComparatorRate('PROMOTION', 'amazon', 'commission', 0);

    const s = usePricingStore.getState();
    expect(s.comparatorCustomRates['amazon'].commission).toBe(10);
    expect(s.comparatorPromoRates['amazon'].commission).toBe(0);
  });

  it('3. Limpar dados preserva a mecânica, resetando cenários mas não o estado da UI por segurança global', () => {
    const store = usePricingStore.getState();
    store.setComparatorRate('CUSTOM', 'amazon', 'commission', 10);
    store.setAdvancedField('comparatorScenario', 'PROMOTION');
    
    store.clearData();
    
    const cleared = usePricingStore.getState();
    // Cenário volta ao default do initialState
    expect(cleared.comparatorScenario).toBe('STANDARD');
    expect(cleared.comparatorCustomRates).toEqual({});
  });
});

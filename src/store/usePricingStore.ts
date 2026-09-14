import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ComparatorScenario = 'STANDARD' | 'CUSTOM' | 'PROMOTION';

export interface ComparatorRate {
  commission: number | null;
  fixedFee: number | null;
  taxes: number | null;
  shipping: number | null;
  marketing: number | null;
  other: number | null;
}

interface AppState {
  // Entradas Básicas
  productCost: number;
  salePrice: number;
  marketplaceId: string;
  marketplaceConditionId: string;
  
  // Custom Overrides para Taxas (Modo PRO)
  customCommissionPercentage: number | null;
  customFixedFee: number | null;

  // Entradas Avançadas (Pro)
  taxesPercentage: number;
  shippingAbsolute: number;
  marketingAbsolute: number;
  otherAbsolute: number;
  targetMarginPercentage: number;

  // UI State
  isProMode: boolean;

  // Comparador de Preços
  comparatorPrices: Record<string, number | null>;
  comparatorScenario: ComparatorScenario;
  comparatorCustomRates: Record<string, ComparatorRate>;
  comparatorPromoRates: Record<string, ComparatorRate>;
  comparatorPromoName: string;
  comparatorPromoStart: string;
  comparatorPromoEnd: string;

  // Ações
  setProductCost: (v: number) => void;
  setSalePrice: (v: number) => void;
  setMarketplace: (id: string, conditionId: string) => void;
  setComparatorPrice: (marketplaceId: string, price: number | null) => void;
  setComparatorRate: (scenario: 'CUSTOM' | 'PROMOTION', marketplaceId: string, field: keyof ComparatorRate, value: number | null) => void;
  setAdvancedField: (field: keyof Omit<AppState, 'setProductCost' | 'setSalePrice' | 'setMarketplace' | 'setAdvancedField' | 'clearData' | 'setComparatorPrice' | 'setComparatorRate'>, value: any) => void;
  clearData: () => void;
}

const initialState = {
  productCost: 0,
  salePrice: 0,
  marketplaceId: 'mercadolivre',
  marketplaceConditionId: 'classic',
  customCommissionPercentage: null,
  customFixedFee: null,
  taxesPercentage: 0,
  shippingAbsolute: 0,
  marketingAbsolute: 0,
  otherAbsolute: 0,
  targetMarginPercentage: 20,
  isProMode: false,
  comparatorPrices: {},
  comparatorScenario: 'STANDARD' as ComparatorScenario,
  comparatorCustomRates: {},
  comparatorPromoRates: {},
  comparatorPromoName: 'Promoção / Isenção',
  comparatorPromoStart: '',
  comparatorPromoEnd: '',
};

export const usePricingStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      setProductCost: (v) => set({ productCost: v }),
      setSalePrice: (v) => set({ salePrice: v }),
      setMarketplace: (id, conditionId) => set({ 
        marketplaceId: id, 
        marketplaceConditionId: conditionId,
        customCommissionPercentage: null, // reseta custom ao mudar marketplace
        customFixedFee: null
      }),
      setComparatorPrice: (id, price) => set((state) => ({ 
        comparatorPrices: { ...state.comparatorPrices, [id]: price } 
      })),
      setComparatorRate: (scenario, marketplaceId, field, value) => set((state) => {
        const key = scenario === 'CUSTOM' ? 'comparatorCustomRates' : 'comparatorPromoRates';
        const currentRates = state[key][marketplaceId] || {
          commission: null, fixedFee: null, taxes: null, shipping: null, marketing: null, other: null
        };
        return {
          [key]: {
            ...state[key],
            [marketplaceId]: { ...currentRates, [field]: value }
          }
        };
      }),
      setAdvancedField: (field, value) => set({ [field]: value }),
      clearData: () => set({ ...initialState }),
    }),
    {
      name: 'quantovende-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);

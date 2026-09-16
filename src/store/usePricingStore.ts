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

  // Onboarding
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (v: boolean) => void;

  // Ações
  setProductCost: (v: number) => void;
  setSalePrice: (v: number) => void;
  setMarketplace: (id: string, conditionId: string) => void;
  setComparatorPrice: (marketplaceId: string, price: number | null) => void;
  setComparatorRate: (scenario: 'CUSTOM' | 'PROMOTION', marketplaceId: string, field: keyof ComparatorRate, value: number | null) => void;
  setAdvancedField: (field: keyof Omit<AppState, 'setProductCost' | 'setSalePrice' | 'setMarketplace' | 'setAdvancedField' | 'clearData' | 'resetAnalysis' | 'setComparatorPrice' | 'setComparatorRate' | 'setHasSeenOnboarding'>, value: any) => void;
  resetAnalysis: () => void;
  clearData: () => void;
  // Supabase / Rate Intelligence
  officialRates: Record<string, any>;
  syncOfficialRates: () => Promise<void>;
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
  officialRates: {},
};

export const usePricingStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (v) => set({ hasSeenOnboarding: v }),
      setProductCost: (v) => set({ productCost: v }),
      setSalePrice: (v) => set({ salePrice: v }),
      setMarketplace: (id, conditionId) => set({ 
        marketplaceId: id, 
        marketplaceConditionId: conditionId,
        customCommissionPercentage: null,
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
      syncOfficialRates: async () => {
        // Import inline to avoid circular dependencies if any
        const { fetchMarketplaceRateProfileAsync } = await import('../core/rate-intelligence');
        const mkts = ['mercadolivre', 'amazon', 'shopee'];
        const newRates: Record<string, any> = {};
        for (const mkt of mkts) {
          const profile = await fetchMarketplaceRateProfileAsync(mkt);
          if (profile) newRates[mkt] = profile;
        }
        set({ officialRates: newRates });
      },
      resetAnalysis: () => set((state) => ({
        ...initialState,
        hasSeenOnboarding: state.hasSeenOnboarding // keeps onboarding status
      })),
      clearData: () => set((state) => ({
        ...initialState,
        hasSeenOnboarding: state.hasSeenOnboarding // clearData also preserves onboarding
      })),
    }),
    {
      name: 'quantovende-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);

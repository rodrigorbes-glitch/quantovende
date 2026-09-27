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

export interface SavedProduct {
  id: string;
  name: string;
  createdAt: string;
  productCost: number;
  salePrice: number;
  marketplaceId: string;
  marketplaceConditionId: string;
  categoryId: string;
  taxesPercentage: number;
  shippingAbsolute: number;
  marketingAbsolute: number;
  otherAbsolute: number;
  isProMode: boolean;
  profit: number;
  margin: number;
  marketplaceName: string;
}

interface AppState {
  // Entradas Básicas
  productCost: number;
  salePrice: number;
  marketplaceId: string;
  marketplaceConditionId: string;
  categoryId: string;
  
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

  // Catálogo de Produtos Salvos
  savedProducts: SavedProduct[];

  // Onboarding
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (v: boolean) => void;

  // Ações
  setProductCost: (v: number) => void;
  setSalePrice: (v: number) => void;
  setMarketplace: (id: string, conditionId: string) => void;
  setCategoryId: (id: string) => void;
  setComparatorPrice: (marketplaceId: string, price: number | null) => void;
  setComparatorRate: (scenario: 'CUSTOM' | 'PROMOTION', marketplaceId: string, field: keyof ComparatorRate, value: number | null) => void;
  setAdvancedField: (field: keyof Omit<AppState, 'setProductCost' | 'setSalePrice' | 'setMarketplace' | 'setCategoryId' | 'setAdvancedField' | 'clearData' | 'resetAnalysis' | 'setComparatorPrice' | 'setComparatorRate' | 'setHasSeenOnboarding' | 'saveCurrentProduct' | 'loadSavedProduct' | 'deleteSavedProduct'>, value: any) => void;
  saveCurrentProduct: (name: string, snapshot: { profit: number; margin: number; marketplaceName: string }) => void;
  loadSavedProduct: (id: string) => void;
  deleteSavedProduct: (id: string) => void;
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
  categoryId: 'general',
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
  savedProducts: [] as SavedProduct[],
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
      setCategoryId: (id) => set({ categoryId: id }),
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
      saveCurrentProduct: (name, snapshot) => set((state) => {
        const newProduct: SavedProduct = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod_${Date.now()}`,
          name: name.trim() || `Produto #${state.savedProducts.length + 1}`,
          createdAt: new Date().toISOString(),
          productCost: state.productCost,
          salePrice: state.salePrice,
          marketplaceId: state.marketplaceId,
          marketplaceConditionId: state.marketplaceConditionId,
          categoryId: state.categoryId || 'general',
          taxesPercentage: state.taxesPercentage || 0,
          shippingAbsolute: state.shippingAbsolute || 0,
          marketingAbsolute: state.marketingAbsolute || 0,
          otherAbsolute: state.otherAbsolute || 0,
          isProMode: state.isProMode,
          profit: snapshot.profit,
          margin: snapshot.margin,
          marketplaceName: snapshot.marketplaceName,
        };
        return {
          savedProducts: [newProduct, ...state.savedProducts]
        };
      }),
      loadSavedProduct: (id) => set((state) => {
        const product = state.savedProducts.find(p => p.id === id);
        if (!product) return state;
        return {
          ...state,
          productCost: product.productCost,
          salePrice: product.salePrice,
          marketplaceId: product.marketplaceId,
          marketplaceConditionId: product.marketplaceConditionId,
          categoryId: product.categoryId || 'general',
          taxesPercentage: product.taxesPercentage || 0,
          shippingAbsolute: product.shippingAbsolute || 0,
          marketingAbsolute: product.marketingAbsolute || 0,
          otherAbsolute: product.otherAbsolute || 0,
          isProMode: product.isProMode || false,
          customCommissionPercentage: null,
          customFixedFee: null,
        };
      }),
      deleteSavedProduct: (id) => set((state) => ({
        savedProducts: state.savedProducts.filter(p => p.id !== id)
      })),
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
        hasSeenOnboarding: state.hasSeenOnboarding,
        savedProducts: state.savedProducts,
        officialRates: state.officialRates,
      })),
      clearData: () => set((state) => ({
        ...initialState,
        hasSeenOnboarding: state.hasSeenOnboarding,
        savedProducts: state.savedProducts,
        officialRates: state.officialRates,
      })),
    }),
    {
      name: 'quantovende-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);

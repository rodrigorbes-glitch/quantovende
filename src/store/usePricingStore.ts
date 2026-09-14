import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

  // Ações
  setProductCost: (v: number) => void;
  setSalePrice: (v: number) => void;
  setMarketplace: (id: string, conditionId: string) => void;
  setComparatorPrice: (marketplaceId: string, price: number | null) => void;
  setAdvancedField: (field: keyof Omit<AppState, 'setProductCost' | 'setSalePrice' | 'setMarketplace' | 'setAdvancedField' | 'clearData' | 'setComparatorPrice'>, value: any) => void;
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
      setAdvancedField: (field, value) => set({ [field]: value }),
      clearData: () => set({ ...initialState }),
    }),
    {
      name: 'quantovende-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);

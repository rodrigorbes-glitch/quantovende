export interface MarketplaceCondition {
  id: string;
  label: string;
  description?: string;
}

export interface CommissionTier {
  minPrice: number;
  maxPrice: number | null; // null means infinity
  percentage: number;
  fixedFee: number;
}

export interface CommissionRule {
  tiers: CommissionTier[];
  conditionId?: string; // If this rule applies to a specific condition
}

export interface ShippingRule {
  type: 'absolute' | 'percentage';
  value: number;
  conditionId?: string;
  minPriceThreshold?: number; // E.g., Mercado Livre charges fixed shipping for products >= R$79
}

export interface MarketplaceConfig {
  id: string;
  name: string;
  country: string;
  currency: string;
  sourceUrl: string;
  lastUpdated: string; // ISO Date
  conditions: MarketplaceCondition[];
  commissions: CommissionRule[];
  shipping: ShippingRule[];
}

export type Marketplaces = Record<string, MarketplaceConfig>;

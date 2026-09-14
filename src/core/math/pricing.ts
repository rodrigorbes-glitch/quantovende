import type { CommissionTier } from '../marketplaces/types';

export interface CostsConfig {
  productCost: number;
  shippingAbsolute: number;
  shippingPercentage: number;
  commissionTiers: CommissionTier[]; // Replaces percentage/fixedFee base
  customFixedFee: number | null; // UI Override
  customCommissionPercentage: number | null; // UI Override
  taxesPercentage: number; 
  marketingAbsolute: number;
  marketingPercentage: number;
  otherAbsolute: number;
  otherPercentage: number;
}

export interface PricingResult {
  salePrice: number;
  totalCosts: number;
  netRevenue: number;
  profit: number;
  margin: number;
  markup: number;
  breakdown: {
    productCost: number;
    marketplaceFee: number;
    marketplaceCommissionExtracted: number;
    marketplaceFixedExtracted: number;
    taxes: number;
    shipping: number;
    marketing: number;
    other: number;
  };
}

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function getActiveCommission(salePrice: number, config: CostsConfig): { percentage: number, fixedFee: number } {
  // Overrides always win
  if (config.customCommissionPercentage !== null && config.customFixedFee !== null) {
    return { percentage: config.customCommissionPercentage, fixedFee: config.customFixedFee };
  }
  
  // Find applicable tier
  const tier = config.commissionTiers.find(t => 
    salePrice >= t.minPrice && 
    (t.maxPrice === null || salePrice <= t.maxPrice)
  );

  if (tier) {
    return {
      percentage: config.customCommissionPercentage !== null ? config.customCommissionPercentage : tier.percentage,
      fixedFee: config.customFixedFee !== null ? config.customFixedFee : tier.fixedFee
    };
  }

  // Fallback if no tier matches (should never happen with correct rule setup)
  return { percentage: 0, fixedFee: 0 };
}

export function calculatePricing(salePrice: number, config: CostsConfig): PricingResult {
  const { percentage, fixedFee } = getActiveCommission(salePrice, config);
  
  const commission = salePrice * (percentage / 100);
  
  const taxes = salePrice * (config.taxesPercentage / 100);
  const marketing = config.marketingAbsolute + (salePrice * (config.marketingPercentage / 100));
  const shipping = config.shippingAbsolute + (salePrice * (config.shippingPercentage / 100));
  const other = config.otherAbsolute + (salePrice * (config.otherPercentage / 100));
  const marketplaceFee = commission + fixedFee;

  const totalCosts = roundToTwo(config.productCost + marketplaceFee + taxes + shipping + marketing + other);
  const netRevenue = roundToTwo(salePrice - marketplaceFee - taxes - shipping - marketing - other);
  const profit = roundToTwo(netRevenue - config.productCost);
  
  const margin = salePrice > 0 ? roundToTwo((profit / salePrice) * 100) : 0;
  const markup = config.productCost > 0 ? roundToTwo((profit / config.productCost) * 100) : 0;

  return {
    salePrice: roundToTwo(salePrice),
    totalCosts,
    netRevenue,
    profit,
    margin,
    markup,
    breakdown: {
      productCost: roundToTwo(config.productCost),
      marketplaceFee: roundToTwo(marketplaceFee),
      marketplaceCommissionExtracted: roundToTwo(commission),
      marketplaceFixedExtracted: roundToTwo(fixedFee),
      taxes: roundToTwo(taxes),
      shipping: roundToTwo(shipping),
      marketing: roundToTwo(marketing),
      other: roundToTwo(other)
    }
  };
}

export function calculateTargetPrice(targetMarginPercentage: number, config: CostsConfig): number | null {
  const otherVariablePercentages = (
    config.taxesPercentage +
    config.shippingPercentage +
    config.marketingPercentage +
    config.otherPercentage +
    targetMarginPercentage
  ) / 100;

  const fixedAbsoluteCostsBase = 
    config.productCost + 
    config.shippingAbsolute + 
    config.marketingAbsolute + 
    config.otherAbsolute;

  // We need to find which tier works.
  let potentialTargets: number[] = [];

  // If there are UI overrides, we use a single pseudo-tier
  const activeTiers = (config.customCommissionPercentage !== null && config.customFixedFee !== null) 
    ? [{ minPrice: 0, maxPrice: null, percentage: config.customCommissionPercentage, fixedFee: config.customFixedFee }]
    : config.commissionTiers;

  for (const tier of activeTiers) {
    const percentage = config.customCommissionPercentage !== null ? config.customCommissionPercentage : tier.percentage;
    const fixedFee = config.customFixedFee !== null ? config.customFixedFee : tier.fixedFee;

    const commissionPercentage = percentage / 100;
    const totalVariable = otherVariablePercentages + commissionPercentage;
    
    if (totalVariable >= 1) continue; // Mathematically impossible to achieve this margin in this tier

    const fixedAbsoluteCosts = fixedAbsoluteCostsBase + fixedFee;
    const theoreticalPrice = fixedAbsoluteCosts / (1 - totalVariable);

    // Validate if the theoretical price falls within this tier's bounds
    // Adding a small epsilon tolerance for float rounding around thresholds
    const tolerance = 0.01;
    if (theoreticalPrice >= (tier.minPrice - tolerance) && (tier.maxPrice === null || theoreticalPrice <= (tier.maxPrice + tolerance))) {
      potentialTargets.push(theoreticalPrice);
    } else if (theoreticalPrice < (tier.minPrice - tolerance)) {
      // Discontinuity dead zone (e.g. crossing ML R$79 threshold where fixed fee drops)
      // The exact target margin is mathematically impossible (it jumps). 
      // Hitting the tier's minimum price is the lowest price that GUARANTEES exceeding the target margin.
      potentialTargets.push(tier.minPrice);
    }
  }

  if (potentialTargets.length === 0) return null;

  // If multiple tiers satisfy the condition (rare edge case of threshold overlap), we return the lowest valid price
  const validTarget = Math.min(...potentialTargets);
  return roundToTwo(validTarget);
}

export function calculateBreakEvenPrice(config: CostsConfig): number | null {
  return calculateTargetPrice(0, config);
}

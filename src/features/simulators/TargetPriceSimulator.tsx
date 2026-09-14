import { useMemo } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { calculateTargetPrice, calculateBreakEvenPrice, type CostsConfig } from '../../core/math/pricing';
import { marketplaces } from '../../core/marketplaces/rules';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/components/Card';
import { Input } from '../../ui/components/Input';
import { Target, Flag } from 'lucide-react';

export function TargetPriceSimulator() {
  const store = usePricingStore();
  
  const mkt = marketplaces[store.marketplaceId];
  const rule = mkt.commissions.find(c => c.conditionId === store.marketplaceConditionId) || mkt.commissions[0];
  
  const config: CostsConfig = useMemo(() => ({
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
  }), [store, rule]);

  const targetPrice = useMemo(() => calculateTargetPrice(store.targetMarginPercentage, config), [store.targetMarginPercentage, config]);
  const breakEven = useMemo(() => calculateBreakEvenPrice(config), [config]);

  if (store.productCost <= 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Target className="w-5 h-5" />
          Qual preço devo cobrar?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Input 
              label="Margem de Lucro Desejada (%)"
              type="number"
              value={store.targetMarginPercentage || ''}
              onChange={e => store.setAdvancedField('targetMarginPercentage', parseFloat(e.target.value) || 0)}
              suffix="%"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-background rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2 text-foreground/70">
              <Flag className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">Preço Mínimo (Zero a zero)</span>
            </div>
            <p className="text-2xl font-bold">
              {breakEven ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakEven) : 'Impossível'}
            </p>
            <p className="text-xs text-foreground/50 mt-1">
              Vender por menos que isso gera prejuízo real.
            </p>
          </div>

          <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2 text-primary/80">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Preço Recomendado</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {targetPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(targetPrice) : 'Impossível'}
            </p>
            <p className="text-xs text-primary/70 mt-1">
              Preço calculado para atingir {store.targetMarginPercentage}% de margem.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

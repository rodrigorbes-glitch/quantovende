import { useMemo, useState } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { calculateTargetPrice, calculateBreakEvenPrice, roundToTwo, type CostsConfig } from '../../core/math/pricing';
import { marketplaces, getCommissionRule } from '../../core/marketplaces/rules';
import { getCategoryById } from '../../core/categories';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/components/Card';
import { Input } from '../../ui/components/Input';
import { Button } from '../../ui/components/Button';
import { Target, Flag, ArrowDownToLine, Sparkles, Check } from 'lucide-react';

export function TargetPriceSimulator() {
  const store = usePricingStore();
  const [appliedType, setAppliedType] = useState<'target' | 'breakEven' | null>(null);
  
  const mkt = marketplaces[store.marketplaceId];
  const rule = getCommissionRule(
    store.marketplaceId, 
    store.marketplaceConditionId, 
    store.officialRates, 
    store.categoryId
  ) || mkt.commissions[0];
  
  const category = getCategoryById(store.categoryId);
  const condition = mkt.conditions.find(c => c.id === store.marketplaceConditionId) || mkt.conditions[0];

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

  const handleApplyPrice = (price: number, type: 'target' | 'breakEven') => {
    store.setSalePrice(roundToTwo(price));
    setAppliedType(type);
    setTimeout(() => setAppliedType(null), 2500);
  };

  const marginPresets = [15, 20, 25, 30];
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (store.productCost <= 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-primary flex items-center gap-2 text-base sm:text-lg">
            <Target className="w-5 h-5 text-primary" />
            <span>Simulador Reverso: Qual preço devo cobrar?</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-foreground/60 bg-background/80 px-2.5 py-1 rounded-full border border-border/60 self-start sm:self-auto">
            <span>{category.icon}</span>
            <span>{category.name}</span>
            <span>•</span>
            <span>{mkt.name} ({condition.label})</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <Input 
            label={
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full mb-1">
                <span className="text-sm font-medium text-foreground/90">Margem de Lucro Desejada no Bolso</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-foreground/50 mr-1 hidden sm:inline">Metas rápidas:</span>
                  {marginPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => store.setAdvancedField('targetMarginPercentage', preset)}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                        store.targetMarginPercentage === preset
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-background hover:bg-card border-border/80 text-foreground/70'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>
            }
            type="number"
            value={store.targetMarginPercentage || ''}
            onChange={e => store.setAdvancedField('targetMarginPercentage', parseFloat(e.target.value) || 0)}
            suffix="%"
            placeholder="Ex: 20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card Preço Mínimo */}
          <div className="bg-background rounded-xl p-4 border border-border/80 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-foreground/70">
                  <Flag className="w-4 h-4 text-warning" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Preço Mínimo (Zero a Zero)</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {breakEven ? fmt(breakEven) : 'Impossível'}
              </p>
              <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
                Cobre exatamente o custo ({fmt(store.productCost)}) + taxas do canal. Lucro: R$ 0,00.
              </p>
            </div>

            {breakEven && (
              <div className="mt-4 pt-3 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPrice(breakEven, 'breakEven')}
                  className="w-full text-xs h-8 flex items-center justify-center gap-1.5 text-foreground/70 hover:text-foreground"
                >
                  {appliedType === 'breakEven' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span className="text-success font-medium">Aplicado à Calculadora!</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Simular Preço Mínimo</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Card Preço Recomendado */}
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Preço Ideal Sugerido</span>
                </div>
                <span className="text-[11px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                  {store.targetMarginPercentage}% Margem
                </span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {targetPrice ? fmt(targetPrice) : 'Impossível com estas taxas'}
              </p>
              <p className="text-xs text-primary/80 mt-1 leading-relaxed">
                Preço exato para sobrar <strong>{store.targetMarginPercentage}% líquido</strong> no bolso após pagar o marketplace.
              </p>
            </div>

            {targetPrice && (
              <div className="mt-4 pt-3 border-t border-primary/20">
                <Button
                  size="sm"
                  onClick={() => handleApplyPrice(targetPrice, 'target')}
                  className="w-full text-xs h-8 flex items-center justify-center gap-1.5 shadow-sm font-semibold"
                >
                  {appliedType === 'target' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Preço Aplicado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Aplicar este Preço na Calculadora</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

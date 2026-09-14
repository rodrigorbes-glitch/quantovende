import { useMemo } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { calculatePricing, type CostsConfig } from '../../core/math/pricing';
import { marketplaces } from '../../core/marketplaces/rules';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/components/Card';
import { ArrowRightLeft } from 'lucide-react';
import { Input, cn } from '../../ui/components/Input';

export function MarketplaceComparator() {
  const store = usePricingStore();

  const comparisons = useMemo(() => {
    // Only show comparator if product cost is filled
    if (store.productCost <= 0) return [];

    return Object.values(marketplaces).map((mkt) => {
      // Pick the first condition as default for comparison if not specified
      const condition = mkt.conditions[0];
      return {
        marketplace: mkt,
        condition
      };
    });
  }, [store.productCost]);

  if (comparisons.length === 0) return null;

  return (
    <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-lg">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Comparador de Marketplaces</h2>
      </div>
      <p className="text-foreground/70 text-sm max-w-2xl">
        Veja como o mesmo cenário se comporta nos principais marketplaces. 
        <br/><span className="italic text-xs">Nota: O lucro pode variar conforme o programa específico selecionado em cada plataforma.</span>
      </p>
      
      <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
        {comparisons.map(({ marketplace, condition }) => {
          // Setup local price state
          const rawLocalPrice = store.comparatorPrices[marketplace.id];
          // If undefined (never touched), inherit global salePrice (even if 0)
          const displayPrice = rawLocalPrice !== undefined ? rawLocalPrice : store.salePrice;
          const activePrice = displayPrice || 0;
          
          const rule = marketplace.commissions.find(c => c.conditionId === condition.id)!;
          
          const config: CostsConfig = {
            productCost: store.productCost,
            shippingAbsolute: store.shippingAbsolute,
            shippingPercentage: 0,
            commissionTiers: rule.tiers,
            customFixedFee: null, // Comparator uses base marketplace rules
            customCommissionPercentage: null, 
            taxesPercentage: store.taxesPercentage,
            marketingAbsolute: store.marketingAbsolute,
            marketingPercentage: 0,
            otherAbsolute: store.otherAbsolute,
            otherPercentage: 0,
          };
          
          const result = activePrice > 0 ? calculatePricing(activePrice, config) : null;
          
          const isHighest = result && result.profit > 0 && Math.max(...comparisons.map(c => {
             const rLocal = store.comparatorPrices[c.marketplace.id];
             const dLocal = rLocal !== undefined ? rLocal : store.salePrice;
             const aLocal = dLocal || 0;
             const r = aLocal > 0 ? calculatePricing(aLocal, {
               ...config, 
               commissionTiers: c.marketplace.commissions.find(com => com.conditionId === c.condition.id)!.tiers
             }) : null;
             return r ? r.profit : 0;
          })) === result.profit;

          return (
            <Card key={marketplace.id} className={cn("min-w-[280px] snap-center shrink-0 flex flex-col", isHighest ? "border-success/50 ring-1 ring-success/50" : "")}>
              <CardHeader className="pb-4">
                <CardTitle className="flex justify-between items-center">
                  <span>{marketplace.name}</span>
                  <span className="text-[10px] font-normal text-foreground/50 bg-foreground/5 px-2 py-1 rounded-full">{condition.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
                <div className="mb-2">
                  <Input 
                    label="Preço de Venda" 
                    type="number" 
                    prefix="R$" 
                    placeholder="0,00"
                    value={displayPrice === null || displayPrice === 0 ? '' : displayPrice} 
                    onChange={e => store.setComparatorPrice(marketplace.id, e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
                
                {result ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs text-foreground/70">Receita Líquida (já com descontos)</p>
                      <p className="text-xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.netRevenue)}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4 mt-auto">
                      <div>
                        <p className="text-xs text-foreground/50 mb-1">Lucro</p>
                        <p className={cn("font-bold", result.profit > 0 ? "text-success" : "text-danger")}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/50 mb-1">Margem</p>
                        <p className={cn("font-bold", result.profit > 0 ? "text-success" : "text-danger")}>
                          {result.margin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-6 text-center text-foreground/50 text-sm">
                    Informe o preço de venda para calcular
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

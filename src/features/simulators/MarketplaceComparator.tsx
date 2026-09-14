import { useMemo, useState } from 'react';
import { usePricingStore, type ComparatorScenario, type ComparatorRate } from '../../store/usePricingStore';
import { calculatePricing, type CostsConfig } from '../../core/math/pricing';
import { marketplaces } from '../../core/marketplaces/rules';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/components/Card';
import { ArrowRightLeft, Settings, TrendingUp, AlertTriangle } from 'lucide-react';
import { Input, cn } from '../../ui/components/Input';


export function MarketplaceComparator() {
  const store = usePricingStore();
  const [openConfigId, setOpenConfigId] = useState<string | null>(null);

  const scenarioOptions = [
    { value: 'STANDARD', label: 'Padrão QuantoVende', desc: 'Usa as regras de referência cadastradas pelo QuantoVende.' },
    { value: 'CUSTOM', label: 'Minha conta', desc: 'Usa as taxas que você informa para sua operação.' },
    { value: 'PROMOTION', label: 'Promoção / Isenção', desc: 'Simula uma condição promocional, desconto ou isenção temporária.' }
  ] as const;

  const currentScenario = scenarioOptions.find(s => s.value === store.comparatorScenario) || scenarioOptions[0];

  const comparisons = useMemo(() => {
    if (store.productCost <= 0) return [];
    return Object.values(marketplaces).map((mkt) => {
      return {
        marketplace: mkt,
        condition: mkt.conditions[0]
      };
    });
  }, [store.productCost]);

  const results = useMemo(() => {
    return comparisons.map(({ marketplace, condition }) => {
      const rawLocalPrice = store.comparatorPrices[marketplace.id];
      const activePrice = (rawLocalPrice !== undefined ? rawLocalPrice : store.salePrice) || 0;
      
      const rule = marketplace.commissions.find(c => c.conditionId === condition.id)!;
      
      let customConfig: ComparatorRate | undefined;
      if (store.comparatorScenario === 'CUSTOM') customConfig = store.comparatorCustomRates[marketplace.id];
      if (store.comparatorScenario === 'PROMOTION') customConfig = store.comparatorPromoRates[marketplace.id];

      const config: CostsConfig = {
        productCost: store.productCost,
        shippingAbsolute: customConfig?.shipping ?? store.shippingAbsolute,
        shippingPercentage: 0,
        commissionTiers: rule.tiers,
        customFixedFee: customConfig?.fixedFee ?? null,
        customCommissionPercentage: customConfig?.commission ?? null,
        taxesPercentage: customConfig?.taxes ?? store.taxesPercentage,
        marketingAbsolute: customConfig?.marketing ?? store.marketingAbsolute,
        marketingPercentage: 0,
        otherAbsolute: customConfig?.other ?? store.otherAbsolute,
        otherPercentage: 0,
      };
      
      const result = activePrice > 0 ? calculatePricing(activePrice, config) : null;
      return { marketplace, condition, activePrice, result };
    });
  }, [comparisons, store]);

  const insights = useMemo(() => {
    const validResults = results.filter(r => r.result && r.result.profit > 0);
    if (validResults.length < 2) return null;

    const sortedByProfit = [...validResults].sort((a, b) => b.result!.profit - a.result!.profit);
    const bestProfit = sortedByProfit[0];
    const secondBestProfit = sortedByProfit[1];
    
    const sortedByMargin = [...validResults].sort((a, b) => b.result!.margin - a.result!.margin);
    const bestMargin = sortedByMargin[0];
    const worstMargin = sortedByMargin[sortedByMargin.length - 1];

    const profitDiff = bestProfit.result!.profit - secondBestProfit.result!.profit;

    return {
      bestProfit,
      secondBestProfit,
      bestMargin,
      worstMargin,
      profitDiff
    };
  }, [results]);

  if (comparisons.length === 0) return null;

  return (
    <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Comparador de Marketplaces</h2>
        </div>
        
        <div className="flex flex-col sm:items-end w-full sm:w-auto">
          <label className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Cenário de Taxas</label>
          <select 
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-medium w-full sm:w-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={store.comparatorScenario}
            onChange={e => store.setAdvancedField('comparatorScenario', e.target.value as ComparatorScenario)}
          >
            {scenarioOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-foreground/70 text-sm max-w-2xl">
        {currentScenario.desc}
      </p>

      {insights && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-primary text-sm uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Onde vale mais a pena?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="text-xl">💰</div>
              <div>
                <strong className="block text-foreground">Melhor lucro</strong>
                <span className="text-foreground/70">Neste cenário, vender na <strong>{insights.bestProfit.marketplace.name}</strong> deixa R$ {insights.profitDiff.toFixed(2).replace('.', ',')} a mais por unidade que o segundo melhor canal.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-xl">📈</div>
              <div>
                <strong className="block text-foreground">Melhor margem</strong>
                <span className="text-foreground/70">Sua maior margem está na <strong>{insights.bestMargin.marketplace.name}</strong> ({insights.bestMargin.result!.margin.toFixed(1)}%).</span>
              </div>
            </div>
            {insights.worstMargin && insights.worstMargin.marketplace.id !== insights.bestMargin.marketplace.id && (
               <div className="flex items-start gap-2 sm:col-span-2 mt-2 bg-background/50 p-3 rounded-lg border border-border/50">
                 <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                 <span className="text-foreground/70">
                   <strong>Atenção:</strong> {insights.worstMargin.marketplace.name} apresenta a menor margem neste cenário.
                 </span>
               </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
        {results.map(({ marketplace, condition, result }) => {
          const isHighestProfit = insights?.bestProfit.marketplace.id === marketplace.id;
          const rates = (store.comparatorScenario === 'CUSTOM' ? store.comparatorCustomRates[marketplace.id] : store.comparatorPromoRates[marketplace.id]) || {};

          return (
            <Card key={marketplace.id} className={cn("flex flex-col relative", isHighestProfit ? "border-success/50 ring-1 ring-success/50" : "")}>
              <CardHeader className="pb-4">
                <CardTitle className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span>{marketplace.name}</span>
                    <div className="group relative cursor-help flex items-center justify-center w-4 h-4 rounded-full bg-foreground/10 text-[10px] font-bold text-foreground/60 hover:bg-primary/20 hover:text-primary transition-colors">
                      i
                      <div className="pointer-events-none opacity-0 group-hover:opacity-100 focus:opacity-100 focus-within:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 sm:-translate-x-1/2 mb-2 w-56 p-3 bg-card border border-border shadow-2xl rounded-lg text-xs font-normal normal-case text-foreground/90 z-50 text-left leading-relaxed">
                        {store.comparatorScenario === 'STANDARD' ? 
                          'Este resultado usa taxas de referência cadastradas pelo QuantoVende. Os custos reais podem variar conforme categoria e condições vigentes.' : 
                          'Simulação personalizada baseada nas regras definidas manualmente por você.'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-normal text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded-full text-center">
                      {condition.label}
                    </span>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full text-center">
                      {store.comparatorScenario === 'STANDARD' ? 'Estimativa' : (store.comparatorScenario === 'CUSTOM' ? 'Minha conta' : 'Promoção')}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6 flex-1 flex flex-col">
                <div className="mb-2">
                  <Input 
                    label="Preço de Venda" 
                    type="number" 
                    prefix="R$" 
                    placeholder="0,00"
                    value={store.comparatorPrices[marketplace.id] === null || store.comparatorPrices[marketplace.id] === 0 ? '' : (store.comparatorPrices[marketplace.id] ?? '')} 
                    onChange={e => store.setComparatorPrice(marketplace.id, e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>

                {store.comparatorScenario !== 'STANDARD' && (
                  <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
                    <button 
                      className="w-full p-3 flex items-center justify-between text-xs font-medium hover:bg-foreground/5 transition-colors"
                      onClick={() => setOpenConfigId(openConfigId === marketplace.id ? null : marketplace.id)}
                    >
                      <span className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5"/> Personalizar taxas</span>
                      <span className="text-foreground/40">{openConfigId === marketplace.id ? 'Esconder' : 'Abrir'}</span>
                    </button>
                    {openConfigId === marketplace.id && (
                      <div className="p-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-foreground/[0.02]">
                        <Input label="Comissão (%)" type="number" placeholder="Padrão" value={rates.commission ?? ''} onChange={e => store.setComparatorRate(store.comparatorScenario as any, marketplace.id, 'commission', e.target.value ? parseFloat(e.target.value) : null)} />
                        <Input label="Taxa Fixa (R$)" type="number" placeholder="Padrão" value={rates.fixedFee ?? ''} onChange={e => store.setComparatorRate(store.comparatorScenario as any, marketplace.id, 'fixedFee', e.target.value ? parseFloat(e.target.value) : null)} />
                        <Input label="Impostos (%)" type="number" placeholder="Padrão" value={rates.taxes ?? ''} onChange={e => store.setComparatorRate(store.comparatorScenario as any, marketplace.id, 'taxes', e.target.value ? parseFloat(e.target.value) : null)} />
                        <Input label="Frete (R$)" type="number" placeholder="Padrão" value={rates.shipping ?? ''} onChange={e => store.setComparatorRate(store.comparatorScenario as any, marketplace.id, 'shipping', e.target.value ? parseFloat(e.target.value) : null)} />
                        <Input label="Ads (R$)" type="number" placeholder="Padrão" value={rates.marketing ?? ''} onChange={e => store.setComparatorRate(store.comparatorScenario as any, marketplace.id, 'marketing', e.target.value ? parseFloat(e.target.value) : null)} />
                        <Input label="Outros (R$)" type="number" placeholder="Padrão" value={rates.other ?? ''} onChange={e => store.setComparatorRate(store.comparatorScenario as any, marketplace.id, 'other', e.target.value ? parseFloat(e.target.value) : null)} />
                      </div>
                    )}
                  </div>
                )}
                
                {result ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs text-foreground/70">Receita Líquida (já com descontos)</p>
                      <p className="text-xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.netRevenue)}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4 mt-auto">
                      <div>
                        <p className="text-xs text-foreground/50 mb-1">Lucro</p>
                        <p className={cn("font-bold text-lg", result.profit > 0 ? "text-success" : "text-danger")}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/50 mb-1">Margem</p>
                        <p className={cn("font-bold text-lg", result.profit > 0 ? "text-success" : "text-danger")}>
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

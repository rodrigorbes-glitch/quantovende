import { useMemo, useState } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { calculatePricing, calculateBreakEvenPrice, roundToTwo, type CostsConfig } from '../../core/math/pricing';
import { marketplaces, getCommissionRule } from '../../core/marketplaces/rules';
import { estimateShipping } from '../../core/shipping';
import { Card, CardContent } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { Tag, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Check, RotateCcw } from 'lucide-react';

export function DiscountSimulator() {
  const store = usePricingStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDiscountPct, setSelectedDiscountPct] = useState<number>(10);
  const [customDiscountInput, setCustomDiscountInput] = useState<string>('');
  const [applied, setApplied] = useState(false);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [isDiscountActive, setIsDiscountActive] = useState(false);

  const mkt = marketplaces[store.marketplaceId];
  const rule = getCommissionRule(
    store.marketplaceId, 
    store.marketplaceConditionId, 
    store.officialRates, 
    store.categoryId
  ) || mkt.commissions[0];

  const kitQty = store.kitQuantity || 1;
  const effectiveCMV = (store.productCost || 0) * kitQty;

  const shippingEstimate = useMemo(() => {
    return estimateShipping(
      store.marketplaceId,
      store.salePrice,
      store.shippingWeightTier,
      store.isProMode ? (store.shippingAbsolute || 0) : 0
    );
  }, [store.marketplaceId, store.salePrice, store.shippingWeightTier, store.isProMode, store.shippingAbsolute]);

  const config: CostsConfig = useMemo(() => ({
    productCost: effectiveCMV,
    shippingAbsolute: shippingEstimate.estimatedCost,
    shippingPercentage: 0,
    commissionTiers: rule.tiers,
    customFixedFee: store.isProMode ? store.customFixedFee : null,
    customCommissionPercentage: store.isProMode ? store.customCommissionPercentage : null,
    taxesPercentage: store.taxesPercentage || 0,
    marketingAbsolute: store.isProMode ? (store.marketingAbsolute || 0) : 0,
    marketingPercentage: 0,
    otherAbsolute: store.isProMode ? (store.otherAbsolute || 0) : 0,
    otherPercentage: 0,
  }), [effectiveCMV, shippingEstimate.estimatedCost, rule.tiers, store.isProMode, store.customFixedFee, store.customCommissionPercentage, store.taxesPercentage, store.marketingAbsolute, store.otherAbsolute]);

  // Use basePrice if a discount is currently active, so discounts are always relative to original table price
  const referencePrice = (isDiscountActive && basePrice) ? basePrice : (store.salePrice || 0);
  const breakEven = useMemo(() => calculateBreakEvenPrice(config), [config]);

  // Max safe discount
  const maxSafe = useMemo(() => {
    if (!breakEven || referencePrice <= breakEven) {
      return { pct: 0, reais: 0 };
    }
    const reais = roundToTwo(referencePrice - breakEven);
    const pct = roundToTwo((reais / referencePrice) * 100);
    return { pct, reais };
  }, [referencePrice, breakEven]);

  // Current active discount percentage
  const activeDiscountPct = customDiscountInput !== '' 
    ? parseFloat(customDiscountInput) || 0 
    : selectedDiscountPct;

  // Discounted price
  const discountedPrice = useMemo(() => {
    if (referencePrice <= 0) return 0;
    const discounted = referencePrice * (1 - activeDiscountPct / 100);
    return Math.max(1, roundToTwo(discounted));
  }, [referencePrice, activeDiscountPct]);

  // Recalculate full financial result at discounted price
  const promoResult = useMemo(() => {
    if (discountedPrice <= 0 || !store.productCost) return null;
    return calculatePricing(discountedPrice, config);
  }, [discountedPrice, config, store.productCost]);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const discountPresets = [5, 10, 15, 20];

  const handleApplyDiscountedPrice = () => {
    if (discountedPrice > 0) {
      if (!isDiscountActive) {
        setBasePrice(store.salePrice);
      }
      store.setSalePrice(discountedPrice);
      setIsDiscountActive(true);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  const handleRestoreBasePrice = () => {
    if (basePrice) {
      store.setSalePrice(basePrice);
    }
    setIsDiscountActive(false);
    setBasePrice(null);
  };

  if (!store.productCost || store.productCost <= 0 || !referencePrice || referencePrice <= 0) {
    return null;
  }

  return (
    <Card className="border border-border/80 bg-card overflow-hidden transition-all duration-200 shadow-sm">
      {/* Clickable Header / Accordion trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-muted/10 transition-colors cursor-pointer"
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight">
                Simulador de Descontos & Promoções
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                Black Friday / Cupons
              </span>
            </div>
            <p className="text-xs text-foreground/60 mt-0.5">
              Descubra até onde você pode baixar o preço sem tomar prejuízo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {maxSafe.pct > 0 && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg hidden sm:inline-block border border-emerald-200 dark:border-emerald-800">
              Desconto máx: {maxSafe.pct}%
            </span>
          )}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <CardContent className="p-4 sm:p-6 pt-0 border-t border-border/50 space-y-5 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Max Safe Discount Callout */}
          <div className="mt-4 p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-amber-900 dark:text-amber-300 block text-sm">
                Piso Seguro de Desconto (Margem Zero)
              </span>
              <p className="text-amber-800/80 dark:text-amber-400/80">
                Seu preço de equilíbrio é <strong>{breakEven ? fmt(breakEven) : 'R$ 0,00'}</strong>.
                {maxSafe.pct > 0 ? (
                  <> Você pode conceder até <strong>{maxSafe.pct}%</strong> de desconto (-{fmt(maxSafe.reais)}) antes de entrar no vermelho.</>
                ) : (
                  <> Seu preço atual já está no piso de custos. Qualquer desconto adicional causará prejuízo operacional.</>
                )}
              </p>
            </div>
            {maxSafe.pct > 0 && (
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-amber-800/60 dark:text-amber-400/60 block">Desconto Máximo</span>
                <span className="text-xl font-extrabold text-amber-700 dark:text-amber-400">{maxSafe.pct}%</span>
              </div>
            )}
          </div>

          {/* Interactive Discount Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Simular Percentual de Desconto:
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {discountPresets.map(preset => {
                const isSelected = customDiscountInput === '' && selectedDiscountPct === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setCustomDiscountInput('');
                      setSelectedDiscountPct(preset);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background hover:bg-muted/50 border-border text-foreground/80'
                    }`}
                  >
                    -{preset}%
                  </button>
                );
              })}

              <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
                <span className="text-xs text-foreground/60">Outro:</span>
                <div className="relative w-24">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="Ex: 12"
                    value={customDiscountInput}
                    onChange={e => setCustomDiscountInput(e.target.value)}
                    className="w-full h-9 pl-2.5 pr-6 rounded-lg border border-input bg-background text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-foreground/40 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Outcome Card */}
          {promoResult && (
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
                {/* Promo Price */}
                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <span className="text-[11px] text-foreground/60 block font-medium">Preço Promocional</span>
                  <div className="flex items-baseline gap-1.5 justify-center sm:justify-start">
                    <span className="text-xl sm:text-2xl font-black text-foreground">{fmt(discountedPrice)}</span>
                    <span className="text-xs text-red-500 font-semibold">(-{fmt(referencePrice - discountedPrice)})</span>
                  </div>
                </div>

                {/* Promo Profit */}
                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <span className="text-[11px] text-foreground/60 block font-medium">Lucro Líquido Real</span>
                  <span className={`text-xl sm:text-2xl font-black ${promoResult.profit > 0 ? 'text-success' : 'text-danger'}`}>
                    {fmt(promoResult.profit)}
                  </span>
                </div>

                {/* Promo Margin */}
                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <span className="text-[11px] text-foreground/60 block font-medium">Margem Líquida</span>
                  <span className={`text-xl sm:text-2xl font-black ${promoResult.margin > 0 ? 'text-foreground' : 'text-danger'}`}>
                    {promoResult.margin}%
                  </span>
                </div>
              </div>

              {/* Status & Diagnostic Message */}
              <div className={`p-3 rounded-xl flex items-start gap-2.5 text-xs ${
                promoResult.profit > 0 && promoResult.margin >= 15
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                  : promoResult.profit > 0
                  ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'
                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40'
              }`}>
                {promoResult.profit > 0 && promoResult.margin >= 15 ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                )}
                <div>
                  <p className="font-semibold">
                    {promoResult.profit > 0 && promoResult.margin >= 15
                      ? 'Margem segura e rentável'
                      : promoResult.profit > 0
                      ? 'Margem reduzida de campanha'
                      : 'Alerta: Preço abaixo do custo operacional'}
                  </p>
                  <p className="opacity-90 mt-0.5">
                    {promoResult.profit > 0 && promoResult.margin >= 15
                      ? `Você continuará lucrando ${fmt(promoResult.profit)} (${promoResult.margin}%) por venda com este desconto.`
                      : promoResult.profit > 0
                      ? `Ideal para girar estoque ou ranquear o anúncio, mas o lucro é menor (${fmt(promoResult.profit)} por unidade).`
                      : `Com este desconto você terá um prejuízo de ${fmt(Math.abs(promoResult.profit))} por cada unidade vendida.`}
                  </p>
                </div>
              </div>

              {/* Action: Apply price or Restore original price */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40 flex-wrap">
                {isDiscountActive ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span>Preço promocional ativo na calculadora</span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestoreBasePrice}
                        className="flex items-center gap-1.5 h-9 text-xs"
                        title="Desfazer desconto e voltar ao preço original"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar preço normal ({basePrice ? fmt(basePrice) : ''})</span>
                      </Button>

                      {store.salePrice !== discountedPrice && (
                        <Button
                          size="sm"
                          onClick={handleApplyDiscountedPrice}
                          className="flex items-center gap-1.5 h-9 text-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Mudar para {fmt(discountedPrice)}</span>
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-end gap-2 w-full">
                    <Button
                      size="sm"
                      onClick={handleApplyDiscountedPrice}
                      className="flex items-center gap-1.5 h-9"
                      disabled={applied}
                    >
                      {applied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Preço aplicado!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Aplicar {fmt(discountedPrice)} na calculadora</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

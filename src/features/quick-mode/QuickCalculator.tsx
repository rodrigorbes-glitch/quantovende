import { useMemo } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { marketplaces } from '../../core/marketplaces/rules';
import { calculatePricing, type CostsConfig } from '../../core/math/pricing';
import { Input, cn } from '../../ui/components/Input';
import { Button } from '../../ui/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/components/Card';
import { TrendingUp, AlertTriangle, XCircle } from 'lucide-react';
import { TargetPriceSimulator } from '../simulators/TargetPriceSimulator';

export function QuickCalculator() {
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

  const result = useMemo(() => {
    if (store.salePrice > 0) {
      return calculatePricing(store.salePrice, config);
    }
    return null;
  }, [store.salePrice, config]);

  const getTrafficLight = (margin: number) => {
    if (margin >= 15) return { color: 'text-success', bg: 'bg-success/10', icon: TrendingUp, title: 'Margem Saudável', desc: 'Seu preço gera um lucro sustentável.' };
    if (margin > 0 && margin < 15) return { color: 'text-warning', bg: 'bg-warning/10', icon: AlertTriangle, title: 'Atenção (Margem Baixa)', desc: 'Pequenos aumentos de custo podem zerar o lucro.' };
    return { color: 'text-danger', bg: 'bg-danger/10', icon: XCircle, title: 'Risco de Prejuízo', desc: 'Neste cenário, você está perdendo dinheiro ou operando no zero.' };
  };

  const InfoTooltip = ({ label, tooltip, isCustom }: { label: string; tooltip: string; isCustom?: boolean }) => (
    <div className="flex items-center gap-1.5 group">
      <span>{label}</span>
      <div 
        className="cursor-help flex items-center justify-center w-4 h-4 rounded-full bg-foreground/10 text-[10px] font-bold text-foreground/60 hover:bg-primary/20 hover:text-primary transition-colors relative"
        tabIndex={0}
      >
        i
        <div className="pointer-events-none opacity-0 group-hover:opacity-100 focus:opacity-100 focus-within:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 sm:-translate-x-1/2 sm:bottom-full mb-2 w-56 sm:w-64 p-3 bg-card border border-border shadow-2xl rounded-lg text-xs font-normal normal-case text-foreground/90 z-50 text-left leading-relaxed">
          {tooltip}
        </div>
      </div>
      {isCustom && (
        <span className="ml-auto text-[10px] font-semibold tracking-wider uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
          Personalizado
        </span>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-6">
        <h2 className="text-2xl font-bold flex items-center justify-between flex-wrap gap-2">
          <span>Modo Rápido</span>
          <button
            onClick={() => {
              if (store.productCost > 0 || store.salePrice > 0) {
                if (window.confirm('Começar uma nova simulação? Os dados desta análise serão substituídos.')) {
                  store.resetAnalysis();
                }
              } else {
                store.resetAnalysis();
              }
            }}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 border border-primary/20 rounded-lg bg-primary/5 shrink-0"
          >
            Nova simulação
          </button>
        </h2>
        <p className="text-foreground/70 text-sm">Descubra rapidamente quanto sobra no seu bolso.</p>
        
        <div className="space-y-4">
          <Input 
            label="Custo do Produto (R$)" 
            type="number" 
            placeholder="0,00"
            prefix="R$"
            value={store.productCost || ''}
            onChange={e => store.setProductCost(parseFloat(e.target.value) || 0)}
          />
          
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-foreground/90">Marketplace</label>
            <select 
              className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={`${store.marketplaceId}|${store.marketplaceConditionId}`}
              onChange={e => {
                const [id, cond] = e.target.value.split('|');
                store.setMarketplace(id, cond);
              }}
            >
              {Object.values(marketplaces).map(m => (
                <optgroup key={m.id} label={m.name}>
                  {m.conditions.map(c => (
                    <option key={c.id} value={`${m.id}|${c.id}`}>
                      {m.name} - {c.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <Input 
            label="Preço de Venda (R$)" 
            type="number" 
            placeholder="0,00"
            prefix="R$"
            value={store.salePrice || ''}
            onChange={e => store.setSalePrice(parseFloat(e.target.value) || 0)}
          />
        </div>

        {store.isProMode && (
          <div className="pt-4 space-y-4 border-t border-border mt-4 animate-in fade-in slide-in-from-top-2">
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Custos Avançados</h3>
              <p className="text-xs text-foreground/50 mt-1">Ajuste estes valores somente se quiser substituir as configurações padrão ou informar custos específicos da sua venda.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label={
                  <InfoTooltip 
                    label="Comissão do marketplace" 
                    tooltip={`Tecnicamente, este campo substitui a comissão padrão usada pelo QuantoVende. Informe aqui a comissão específica que você realmente paga ao marketplace, somente se souber que ela é diferente da padrão. Ex.: comissão padrão ${rule.tiers[0].percentage}%. Se sua taxa real for 16%, informe 16%.`}
                    isCustom={store.customCommissionPercentage !== null}
                  />
                }
                type="number" 
                placeholder={rule.tiers[0].percentage.toString()}
                suffix="%"
                value={store.customCommissionPercentage ?? ''}
                onChange={e => store.setAdvancedField('customCommissionPercentage', e.target.value ? parseFloat(e.target.value) : null)}
              />
              <Input 
                label={
                  <InfoTooltip 
                    label="Taxa fixa" 
                    tooltip={`Este campo permite substituir a taxa fixa padrão usada pelo QuantoVende. Informe aqui o valor específico cobrado na sua venda, somente se ele for diferente do padrão. Ex.: taxa padrão R$ ${rule.tiers[0].fixedFee}. Se sua taxa real for R$ 8, informe 8.`}
                    isCustom={store.customFixedFee !== null}
                  />
                }
                type="number" 
                placeholder={rule.tiers[0].fixedFee.toString()}
                prefix="R$"
                value={store.customFixedFee ?? ''}
                onChange={e => store.setAdvancedField('customFixedFee', e.target.value ? parseFloat(e.target.value) : null)}
              />
              <Input 
                label="Impostos (%)" 
                type="number" 
                placeholder="0"
                suffix="%"
                value={store.taxesPercentage || ''}
                onChange={e => store.setAdvancedField('taxesPercentage', parseFloat(e.target.value) || 0)}
              />
              <Input 
                label="Frete / Envios (R$)" 
                type="number" 
                placeholder="0,00"
                prefix="R$"
                value={store.shippingAbsolute || ''}
                onChange={e => store.setAdvancedField('shippingAbsolute', parseFloat(e.target.value) || 0)}
              />
              <Input 
                label="Publicidade / Ads (R$)" 
                type="number" 
                placeholder="0,00"
                prefix="R$"
                value={store.marketingAbsolute || ''}
                onChange={e => store.setAdvancedField('marketingAbsolute', parseFloat(e.target.value) || 0)}
              />
              <Input 
                label="Outros Custos (R$)" 
                type="number" 
                placeholder="0,00"
                prefix="R$"
                value={store.otherAbsolute || ''}
                onChange={e => store.setAdvancedField('otherAbsolute', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        )}

        <div className="pt-4">
           <Button 
            variant="outline"
            className="w-full gap-2"
            onClick={() => store.setAdvancedField('isProMode', !store.isProMode)}
           >
             {store.isProMode ? "Ocultar Configurações Avançadas" : "Configurações Avançadas (PRO)"}
           </Button>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        {/* Simulators that don't depend on Sale Price */}
        {store.productCost > 0 && <TargetPriceSimulator />}
        
        {!result ? (
          <Card className="h-full min-h-[300px] flex items-center justify-center border-dashed bg-transparent shadow-none">
            <div className="text-center p-6 max-w-sm">
              <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-sm">
                <Calculator className="w-8 h-8 text-foreground/30" />
              </div>
              <p className="text-foreground/50 text-sm">
                Preencha o <strong>Preço de Venda</strong> no painel ao lado para visualizar a análise completa do seu lucro e para onde vai o seu dinheiro.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="bg-card">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Você Vende Por</p>
                    <p className="text-3xl sm:text-4xl font-bold text-foreground break-words">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.salePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Lucro Líquido Estimado</p>
                    <p className={cn("text-3xl sm:text-4xl font-bold break-words", result.profit > 0 ? "text-success" : "text-danger")}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.profit)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-medium text-foreground/80">Margem Líquida</p>
                    <p className="text-lg font-bold">{result.margin}%</p>
                  </div>
                  
                  {(() => {
                    const status = getTrafficLight(result.margin);
                    const StatusIcon = status.icon;
                    return (
                      <div className={cn("rounded-xl p-4 flex gap-4", status.bg)}>
                        <div className="shrink-0 mt-0.5">
                          <StatusIcon className={cn("w-5 h-5", status.color)} />
                        </div>
                        <div>
                          <p className={cn("font-semibold text-sm mb-0.5", status.color)}>{status.title}</p>
                          <p className={cn("text-xs opacity-90", status.color)}>{status.desc}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Para onde vai seu dinheiro?</CardTitle>
                {store.marketplaceId === 'mercadolivre' && result.salePrice >= 79 && store.shippingAbsolute === 0 && (
                  <div className="bg-warning/10 border border-warning/20 text-warning-dark p-3 rounded-lg mt-2 text-sm flex gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p><strong>Atenção:</strong> No Mercado Livre, anúncios acima de R$79 ativam Frete Grátis obrigatório. O custo do frete será cobrado de você. Se você não informar esse valor no Modo PRO, sua margem real será muito menor.</p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm py-2 border-b border-border/50">
                    <span className="text-foreground/70">Produto</span>
                    <span className="font-medium text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.breakdown.productCost)}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm py-2 border-b border-border/50">
                    <div className="flex flex-col">
                      <span className="text-foreground/70">Comissão & Taxas ({mkt.name})</span>
                      <span className="text-[10px] text-foreground/50">
                        R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(result.breakdown.marketplaceCommissionExtracted)} comissão + R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(result.breakdown.marketplaceFixedExtracted)} fixo
                      </span>
                    </div>
                    <span className="font-medium text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.breakdown.marketplaceFee)}</span>
                  </div>
                  
                  {result.breakdown.taxes > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm py-2 border-b border-border/50">
                      <span className="text-foreground/70">Impostos ({config.taxesPercentage}%)</span>
                      <span className="font-medium text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.breakdown.taxes)}</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm py-2 border-b border-border/50 opacity-50">
                      <span className="text-foreground/70">Impostos</span>
                      <span className="font-medium text-foreground/50">Não informado (R$ 0)</span>
                    </div>
                  )}

                  {result.breakdown.shipping > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm py-2 border-b border-border/50">
                      <span className="text-foreground/70">Frete / Envio</span>
                      <span className="font-medium text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.breakdown.shipping)}</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm py-2 border-b border-border/50 opacity-50">
                      <span className="text-foreground/70">Frete / Envio</span>
                      <span className="font-medium text-foreground/50">Não informado (R$ 0)</span>
                    </div>
                  )}

                  {result.breakdown.marketing > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm py-2 border-b border-border/50">
                      <span className="text-foreground/70">Publicidade</span>
                      <span className="font-medium text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.breakdown.marketing)}</span>
                    </div>
                  ) : (
                    <div className="hidden"></div>
                  )}

                  {result.breakdown.other > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm py-2 border-b border-border/50">
                      <span className="text-foreground/70">Outros Custos</span>
                      <span className="font-medium text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.breakdown.other)}</span>
                    </div>
                  ) : (
                    <div className="hidden"></div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm py-3 bg-success/10 rounded-lg px-3 -mx-3 mt-4">
                    <span className="text-success font-medium">Lucro Líquido</span>
                    <span className="font-bold text-success text-base">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.profit)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Temporary internal import to avoid dependency missing
import { Calculator } from 'lucide-react';

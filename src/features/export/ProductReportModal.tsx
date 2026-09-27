import { useState, useMemo } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { marketplaces } from '../../core/marketplaces/rules';
import { getCategoryById } from '../../core/categories';
import { calculateBreakEvenPrice, type CostsConfig } from '../../core/math/pricing';
import { Button } from '../../ui/components/Button';
import { Logo } from '../../ui/components/Logo';
import { X, Printer, ShieldCheck, FileText } from 'lucide-react';

interface ProductReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
  rule: any;
}

export function ProductReportModal({ isOpen, onClose, result, rule }: ProductReportModalProps) {
  const store = usePricingStore();
  const [productTitle, setProductTitle] = useState('');

  const mkt = marketplaces[store.marketplaceId];
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

  const breakEvenPrice = useMemo(() => calculateBreakEvenPrice(config), [config]);

  if (!isOpen || !result) return null;

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Header (Hidden during print) */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/20 print:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight">Ficha Técnica de Precificação</h3>
                <p className="text-xs text-foreground/60">Gere um documento profissional em PDF ou impresso</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handlePrint} className="flex items-center gap-1.5 shadow-sm">
                <Printer className="w-4 h-4" />
                <span>Imprimir / Salvar PDF</span>
              </Button>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-foreground/70 shrink-0">Identificação:</span>
            <input
              type="text"
              placeholder="Nome ou código do produto / SKU (opcional)"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
              className="flex-1 h-8 px-2.5 rounded-lg border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary placeholder:text-foreground/40"
            />
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900" id="printable-report">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-report, #printable-report * {
                visibility: visible;
              }
              #printable-report {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 18px 24px;
                background: white !important;
                color: #0f172a !important;
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
              @page {
                margin: 10mm;
                size: portrait;
              }
            }
          `}} />

          {/* Document Header */}
          <div className="flex justify-between items-start pb-5 border-b border-slate-200 gap-4">
            <div>
              <div className="mb-1">
                <Logo isPrint={true} size="md" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Relatório Oficial de Precificação & Rentabilidade</p>
            </div>

            <div className="text-right text-xs text-slate-500 space-y-0.5">
              <p><strong>Emissão:</strong> {now}</p>
              <p className="flex items-center justify-end gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Taxas Oficiais Atualizadas
              </p>
            </div>
          </div>

          {/* Product Title (if provided) */}
          {productTitle.trim() ? (
            <div className="mt-4 p-3 rounded-lg bg-slate-100 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Produto / Identificação</span>
              <p className="text-base font-bold text-slate-900 leading-snug">{productTitle.trim()}</p>
            </div>
          ) : null}

          {/* Context Banner */}
          <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Marketplace / Canal</span>
              <span className="font-bold text-slate-800 text-sm">{mkt.name}</span>
              <span className="text-[11px] text-slate-600 block">{condition.label}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Categoria</span>
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[11px]">Taxa da Categoria</span>
              <span className="font-bold text-slate-800 text-sm">
                {rule.tiers[0]?.percentage || 0}%
                {rule.tiers[0]?.fixedFee ? ` + R$ ${rule.tiers[0].fixedFee.toFixed(2)}` : ''}
              </span>
            </div>
          </div>

          {/* 3 Key Big Numbers */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium block mb-0.5">Preço de Venda</span>
              <span className="text-lg sm:text-2xl font-black text-slate-900">{fmt(result.salePrice)}</span>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium block mb-0.5">Custo (CMV)</span>
              <span className="text-lg sm:text-2xl font-black text-slate-700">{fmt(result.breakdown.productCost)}</span>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[11px] sm:text-xs text-emerald-800 font-medium block mb-0.5">Lucro Líquido Real</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-700">{fmt(result.profit)}</span>
              <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">Margem: {result.margin}%</span>
            </div>
          </div>

          {/* Detailed Costs Breakdown Table */}
          <div className="space-y-2.5 mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
              Detalhamento de Custos e Retenções
            </h4>

            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 text-slate-600">Custo da Mercadoria (CMV)</td>
                  <td className="py-2 text-right font-medium text-slate-900">{fmt(result.breakdown.productCost)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">Comissão do Canal ({rule.tiers[0]?.percentage || 0}%)</td>
                  <td className="py-2 text-right font-medium text-red-600">- {fmt(result.breakdown.marketplaceCommissionExtracted)}</td>
                </tr>
                {result.breakdown.marketplaceFixedExtracted > 0 && (
                  <tr>
                    <td className="py-2 text-slate-600">Tarifa Fixa Operacional</td>
                    <td className="py-2 text-right font-medium text-red-600">- {fmt(result.breakdown.marketplaceFixedExtracted)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 text-slate-600">Impostos ({store.taxesPercentage || 0}%)</td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {result.breakdown.taxes > 0 ? `- ${fmt(result.breakdown.taxes)}` : 'R$ 0,00'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">Frete / Envio</td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {result.breakdown.shipping > 0 ? `- ${fmt(result.breakdown.shipping)}` : 'R$ 0,00'}
                  </td>
                </tr>
                {(result.breakdown.marketing > 0 || result.breakdown.other > 0) && (
                  <tr>
                    <td className="py-2 text-slate-600">Publicidade & Outras Despesas</td>
                    <td className="py-2 text-right font-medium text-red-600">
                      - {fmt(result.breakdown.marketing + result.breakdown.other)}
                    </td>
                  </tr>
                )}
                <tr className="font-bold bg-slate-50">
                  <td className="py-2 px-2 text-slate-900">Total de Despesas e Custos</td>
                  <td className="py-2 px-2 text-right text-red-700">- {fmt(result.totalCosts)}</td>
                </tr>
                <tr className="font-bold bg-emerald-50 text-emerald-900">
                  <td className="py-2.5 px-2">Resultado Líquido Final (Sobra no Bolso)</td>
                  <td className="py-2.5 px-2 text-right text-emerald-700 font-bold">{fmt(result.profit)} ({result.margin}%)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Break-even Indicator */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs mb-5">
            <div>
              <span className="font-bold text-amber-900">Preço Mínimo de Equilíbrio (Break-Even):</span>
              <p className="text-[11px] text-amber-700">Abaixo deste valor a venda resulta em prejuízo operacional.</p>
            </div>
            <span className="font-extrabold text-sm text-amber-900">{breakEvenPrice !== null ? fmt(breakEvenPrice) : '—'}</span>
          </div>

          {/* Notes / Disclaimer */}
          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p><strong>Observações:</strong> Simulação gerada com base nas tabelas de comissões oficiais do {mkt.name}. Impostos e despesas de envio consideram os valores informados pelo lojista.</p>
            <p className="text-slate-400">QuantoVende • Inteligência de Precificação para E-commerce • quantovende.vercel.app</p>
          </div>
        </div>

        {/* Modal Controls Footer (Hidden during print) */}
        <div className="p-3 sm:p-4 border-t border-border bg-card flex items-center justify-between text-xs text-foreground/60 print:hidden">
          <span>Dica: Na janela de impressão do navegador, selecione <strong>"Salvar como PDF"</strong>.</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

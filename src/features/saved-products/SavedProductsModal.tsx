import { useState } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { getCategoryById } from '../../core/categories';
import { Button } from '../../ui/components/Button';
import { Logo } from '../../ui/components/Logo';
import { X, Trash2, ArrowUpRight, Search, Package, Printer, Sparkles } from 'lucide-react';

interface SavedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedProductsModal({ isOpen, onClose }: SavedProductsModalProps) {
  const store = usePricingStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredProducts = (store.savedProducts || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.marketplaceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalProfit = filteredProducts.reduce((acc, p) => acc + (p.profit || 0), 0);
  const avgMargin = filteredProducts.length > 0 
    ? (filteredProducts.reduce((acc, p) => acc + (p.margin || 0), 0) / filteredProducts.length).toFixed(1)
    : '0';

  const handlePrint = () => {
    window.print();
  };

  const handleLoad = (id: string) => {
    store.loadSavedProduct(id);
    onClose();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}" dos seus produtos salvos?`)) {
      store.deleteSavedProduct(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Screen only) */}
        <div className="p-6 border-b border-border flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Produtos Salvos
                <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                  {store.savedProducts?.length || 0}
                </span>
              </h2>
              <p className="text-xs text-foreground/60">Seu catálogo de produtos precificados no QuantoVende</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(store.savedProducts?.length || 0) > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-1.5 h-9"
                title="Imprimir ou gerar PDF simplificado da lista"
              >
                <Printer className="w-4 h-4 text-primary" />
                <span>Imprimir / PDF</span>
              </Button>
            )}
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {(store.savedProducts?.length || 0) > 0 && (
          <div className="p-4 border-b border-border/50 bg-muted/20 print:hidden">
            <div className="relative">
              <Search className="w-4 h-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome do produto ou canal..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Free Plan / Pro Limit Alert */}
        {!store.isProUser && (
          <div className="mx-6 mt-4 p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-foreground/90">
                Plano Gratuito: <strong>{store.savedProducts?.length || 0}/3 produtos</strong> salvos. Desbloqueie o catálogo ilimitado no PRO.
              </span>
            </div>
            <button
              onClick={() => {
                store.setProModalOpen(true);
              }}
              className="text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 rounded-xl shrink-0 transition-colors shadow-sm"
            >
              Conhecer o PRO
            </button>
          </div>
        )}

        {/* Product List (Screen only) */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 print:hidden">
          {(!store.savedProducts || store.savedProducts.length === 0) ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto text-foreground/30">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">Nenhum produto salvo ainda</h3>
              <p className="text-sm text-foreground/60 max-w-sm mx-auto">
                Faça uma simulação na calculadora e clique no botão <strong>"Salvar Produto"</strong> para montar o seu catálogo!
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-foreground/50 text-sm">
              Nenhum produto encontrado para a busca "{searchTerm}".
            </div>
          ) : (
            filteredProducts.map((product) => {
              const category = getCategoryById(product.categoryId);
              return (
                <div 
                  key={product.id}
                  className="p-4 rounded-xl border border-border/70 hover:border-primary/40 bg-card hover:bg-accent/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                        {product.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground/70 font-medium">
                        {product.marketplaceName}
                      </span>
                      {product.kitQuantity && product.kitQuantity > 1 ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
                          Kit {product.kitQuantity} un
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-foreground/60 flex-wrap">
                      <span>Custo: <strong className="text-foreground">{fmt(product.productCost)}</strong></span>
                      <span>•</span>
                      <span>Venda: <strong className="text-foreground">{fmt(product.salePrice)}</strong></span>
                      <span>•</span>
                      <span>
                        Salvo em: {new Date(product.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    <div className="text-right">
                      <div className="text-xs text-foreground/60 font-medium">Lucro Líquido</div>
                      <div className="text-base font-bold text-success flex items-center gap-1 justify-end">
                        <span>{fmt(product.profit)}</span>
                        <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-success/10 text-success">
                          {product.margin}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handleLoad(product.id)}
                        className="flex items-center gap-1 h-9 px-3"
                      >
                        <span>Carregar</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>

                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="w-9 h-9 rounded-lg border border-border/60 hover:border-danger/40 hover:bg-danger/10 hover:text-danger text-foreground/40 transition-colors flex items-center justify-center shrink-0"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Printable Catalog Report Table (Visible only in print) */}
        <div id="printable-saved-products" className="hidden print:block p-6 bg-white text-slate-900">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-saved-products, #printable-saved-products * {
                visibility: visible;
              }
              #printable-saved-products {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 16px 20px;
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

          {/* Report Header */}
          <div className="flex justify-between items-start pb-4 border-b border-slate-200 mb-4">
            <div>
              <div className="mb-1">
                <Logo isPrint={true} size="md" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Catálogo de Produtos & Análise de Margens</p>
            </div>
            <div className="text-right text-xs text-slate-500 space-y-0.5">
              <p><strong>Emissão:</strong> {now}</p>
              <p><strong>Total de Produtos:</strong> {filteredProducts.length}</p>
            </div>
          </div>

          {/* Consolidated KPI Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-medium block">Produtos Cadastrados</span>
              <span className="text-lg font-black text-slate-800">{filteredProducts.length}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-medium block">Margem Média</span>
              <span className="text-lg font-black text-blue-700">{avgMargin}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-800 font-medium block">Lucro Acumulado (1 un. cada)</span>
              <span className="text-lg font-black text-emerald-700">{fmt(totalProfit)}</span>
            </div>
          </div>

          {/* Products Table */}
          <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2 px-2.5 text-left font-bold">Produto</th>
                <th className="py-2 px-2 text-left font-bold">Canal / Categoria</th>
                <th className="py-2 px-2 text-right font-bold">Custo (CMV)</th>
                <th className="py-2 px-2 text-right font-bold">Preço Venda</th>
                <th className="py-2 px-2 text-right font-bold text-emerald-800">Lucro Líquido</th>
                <th className="py-2 px-2.5 text-right font-bold">Margem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const cat = getCategoryById(p.categoryId);
                return (
                  <tr key={p.id}>
                    <td className="py-2 px-2.5 font-bold text-slate-900">
                      <div>{p.name}</div>
                      {p.kitQuantity && p.kitQuantity > 1 ? (
                        <div className="text-[10px] text-emerald-700 font-semibold">Kit com {p.kitQuantity} unidades</div>
                      ) : null}
                    </td>
                    <td className="py-2 px-2 text-slate-600">
                      <div>{p.marketplaceName}</div>
                      <div className="text-[10px] text-slate-400">{cat.name}</div>
                    </td>
                    <td className="py-2 px-2 text-right font-medium text-slate-700">{fmt(p.productCost)}</td>
                    <td className="py-2 px-2 text-right font-bold text-slate-900">{fmt(p.salePrice)}</td>
                    <td className="py-2 px-2 text-right font-bold text-emerald-700">{fmt(p.profit)}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-slate-800">{p.margin}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Report Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
            <span>QuantoVende • Inteligência de Precificação para E-commerce</span>
            <span>quantovende.vercel.app</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between text-xs text-foreground/60 print:hidden">
          <span>Seus produtos ficam salvos com segurança no seu navegador</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

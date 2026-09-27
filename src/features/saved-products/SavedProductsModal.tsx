import { useState } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { getCategoryById } from '../../core/categories';
import { Button } from '../../ui/components/Button';
import { X, Trash2, ArrowUpRight, Search, Package } from 'lucide-react';

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
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
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
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        {(store.savedProducts?.length || 0) > 0 && (
          <div className="p-4 border-b border-border/50 bg-muted/20">
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

        {/* Product List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
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

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between text-xs text-foreground/60">
          <span>Seus produtos ficam salvos com segurança no seu navegador</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

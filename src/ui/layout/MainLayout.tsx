import type { ReactNode } from 'react';
import { useState } from 'react';
import { Calculator, Package } from 'lucide-react';
import { usePricingStore } from '../../store/usePricingStore';
import { OnboardingModal } from '../../features/onboarding/OnboardingModal';
import { SavedProductsModal } from '../../features/saved-products/SavedProductsModal';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const store = usePricingStore();
  const [forceOnboarding, setForceOnboarding] = useState(false);
  const [savedProductsOpen, setSavedProductsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground flex flex-col">
      <OnboardingModal forceOpen={forceOnboarding} onClose={() => setForceOnboarding(false)} />
      <SavedProductsModal isOpen={savedProductsOpen} onClose={() => setSavedProductsOpen(false)} />
      
      <header className="border-b border-border/40 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => { window.location.href = '/'; }}>
            <div className="bg-primary/10 p-2 rounded-lg">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Quanto<span className="text-primary">Vende</span></span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSavedProductsOpen(true)}
              className="text-xs font-semibold text-primary hover:text-primary/90 transition-colors px-2.5 py-1.5 rounded-lg bg-primary/10 flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Meus Produtos</span>
              {(store.savedProducts?.length || 0) > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {store.savedProducts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { window.location.href = '/integracoes'; }}
              className="text-xs font-medium text-foreground/60 hover:text-foreground transition-colors px-2 py-1.5"
            >
              Integrações
            </button>
            <button
              onClick={() => setForceOnboarding(true)}
              className="text-xs font-medium text-foreground/60 hover:text-foreground transition-colors px-2 py-1.5"
            >
              Como funciona
            </button>
            <button 
              onClick={() => {
                if (window.confirm('Tem certeza que deseja apagar todos os dados persistidos e resetar o aplicativo?')) {
                  store.clearData();
                  localStorage.removeItem('quantovende-storage');
                  window.location.reload();
                }
              }}
              className="text-xs font-medium text-foreground/50 hover:text-foreground transition-colors px-3 py-1.5 border border-border/40 rounded-lg bg-background shadow-sm hover:shadow shrink-0"
            >
              Limpar dados
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-xs text-foreground/50 text-center">
            Os valores apresentados são estimativas baseadas nas informações inseridas e nas regras disponíveis.
            Tarifas, impostos, fretes e condições comerciais podem variar. Confirme os valores aplicáveis no marketplace antes de tomar decisões comerciais.
          </p>
        </div>
      </footer>
    </div>
  );
}

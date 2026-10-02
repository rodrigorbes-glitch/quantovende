import type { ReactNode } from 'react';
import { useState } from 'react';
import { Package, Sparkles, Menu, X, Smartphone, HelpCircle, Trash2, Link, User } from 'lucide-react';
import { usePricingStore } from '../../store/usePricingStore';
import { OnboardingModal } from '../../features/onboarding/OnboardingModal';
import { SavedProductsModal } from '../../features/saved-products/SavedProductsModal';
import { ProPlansModal } from '../../features/subscription/ProPlansModal';
import { UserProfileModal } from '../../features/subscription/UserProfileModal';
import { Logo } from '../components/Logo';
import { InstallPwaBanner, usePwa } from '../components/InstallPwa';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const store = usePricingStore();
  const [forceOnboarding, setForceOnboarding] = useState(false);
  const [savedProductsOpen, setSavedProductsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { canInstall, triggerInstall } = usePwa();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground flex flex-col">
      <OnboardingModal forceOpen={forceOnboarding} onClose={() => setForceOnboarding(false)} />
      <SavedProductsModal isOpen={savedProductsOpen} onClose={() => setSavedProductsOpen(false)} />
      <ProPlansModal isOpen={store.isProModalOpen} onClose={() => store.setProModalOpen(false)} />
      <UserProfileModal 
        isOpen={store.isProfileModalOpen} 
        onClose={() => store.setProfileModalOpen(false)} 
        onOpenPlans={() => store.setProModalOpen(true)} 
      />
      <InstallPwaBanner />
      
      <header className="border-b border-border/40 bg-card sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="cursor-pointer shrink-0" onClick={() => { window.location.href = '/'; }}>
            <div className="block sm:hidden">
              <Logo size="sm" />
            </div>
            <div className="hidden sm:block">
              <Logo size="md" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2.5">
            {store.isProUser ? (
              <button
                onClick={() => store.setProfileModalOpen(true)}
                className="text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
                title="Minha Conta PRO & Configurações da Loja"
              >
                <User className="w-3.5 h-3.5" />
                <span>{store.proStoreName ? `${store.proStoreName} (PRO)` : 'Minha Conta PRO'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => store.setProModalOpen(true)}
                  className="text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-amber-950" />
                  <span>Seja PRO</span>
                </button>
                <button
                  onClick={() => store.setProfileModalOpen(true)}
                  className="text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg border border-border/70 hover:bg-muted/50 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </button>
              </>
            )}

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
              className="text-xs font-medium text-foreground/50 hover:text-foreground transition-colors px-3 py-1.5 border border-border/40 rounded-lg bg-background shadow-xs hover:shadow-sm shrink-0"
            >
              Limpar dados
            </button>
          </div>

          {/* Mobile Actions Bar */}
          <div className="flex md:hidden items-center gap-1.5">
            {store.isProUser ? (
              <button
                onClick={() => store.setProfileModalOpen(true)}
                className="text-[11px] font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1"
              >
                <User className="w-3 h-3" />
                <span>Conta PRO</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => store.setProModalOpen(true)}
                  className="text-[11px] font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 fill-amber-950" />
                  <span>PRO</span>
                </button>
                <button
                  onClick={() => store.setProfileModalOpen(true)}
                  className="text-[11px] font-semibold text-foreground/80 border border-border px-2 py-1 rounded-lg flex items-center gap-1 bg-card"
                >
                  <User className="w-3 h-3" />
                  <span>Entrar</span>
                </button>
              </>
            )}

            <button
              onClick={() => setSavedProductsOpen(true)}
              className="p-1.5 rounded-lg bg-primary/10 text-primary relative flex items-center justify-center"
              title="Meus Produtos Salvos"
            >
              <Package className="w-4 h-4" />
              {(store.savedProducts?.length || 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {store.savedProducts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-border bg-card text-foreground/70 hover:text-foreground"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {canInstall && (
              <button
                onClick={() => {
                  triggerInstall();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              >
                <Smartphone className="w-4 h-4" />
                <span>📱 Instalar App no Celular</span>
              </button>
            )}
            <button
              onClick={() => {
                store.setProfileModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted/50 border border-border/40"
            >
              <User className="w-4 h-4 text-amber-500" />
              <span>{store.isProUser ? '👤 Minha Conta PRO' : '👤 Entrar com E-mail'}</span>
            </button>
            <button
              onClick={() => {
                setSavedProductsOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/50"
            >
              <Package className="w-4 h-4 text-primary" />
              <span>Meus Produtos Salvos ({store.savedProducts?.length || 0})</span>
            </button>
            <button
              onClick={() => {
                window.location.href = '/integracoes';
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/50"
            >
              <Link className="w-4 h-4 text-foreground/60" />
              <span>Integrações (OAuth)</span>
            </button>
            <button
              onClick={() => {
                setForceOnboarding(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/50"
            >
              <HelpCircle className="w-4 h-4 text-foreground/60" />
              <span>Como funciona</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (window.confirm('Tem certeza que deseja apagar todos os dados persistidos e resetar o aplicativo?')) {
                  store.clearData();
                  localStorage.removeItem('quantovende-storage');
                  window.location.reload();
                }
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar dados / Resetar</span>
            </button>
          </div>
        )}
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

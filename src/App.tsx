import { useEffect, useState } from 'react';
import { MainLayout } from './ui/layout/MainLayout';
import { QuickCalculator } from './features/quick-mode/QuickCalculator';
import { MarketplaceComparator } from './features/simulators/MarketplaceComparator';
import { LandingPage } from './features/landing/LandingPage';
import MercadoLivreCallback from './pages/oauth/Callback';
import { MercadoLivreConnect } from './features/oauth/MercadoLivreConnect';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';
import { usePricingStore } from './store/usePricingStore';

import { AdminDashboard } from './pages/admin/AdminDashboard';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [showProCelebration, setShowProCelebration] = useState(false);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', onLocationChange);

    // Auto-ativação PRO pós-pagamento (ex: redirect do Asaas com ?pro_activated=true)
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('pro_activated') === 'true' || searchParams.get('pro') === '1') {
      usePricingStore.getState().setIsProUser(true);
      setShowProCelebration(true);
      searchParams.delete('pro_activated');
      searchParams.delete('pro');
      const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
      window.history.replaceState({}, '', `/calculadora${cleanSearch}`);
      setCurrentPath('/calculadora');
    } else if (window.location.search && (window.location.search.includes('cost=') || window.location.search.includes('price='))) {
      // Se a URL tiver parametros de simulacao (?cost=... ou ?price=...), redireciona para a calculadora
      if (window.location.pathname !== '/calculadora') {
        window.history.replaceState({}, '', `/calculadora${window.location.search}`);
        setCurrentPath('/calculadora');
      }
    }

    // Sync official rates once when app loads
    usePricingStore.getState().syncOfficialRates();

    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  const renderCelebration = () => {
    if (!showProCelebration) return null;
    return (
      <aside aria-label="Notificação de Assinatura" className="fixed top-5 right-5 z-[9999] max-w-sm sm:max-w-md bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white p-4 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
        <div className="p-2 bg-white/20 rounded-xl shrink-0">
          <Sparkles className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <h4 className="font-bold text-sm">Assinatura PRO Ativada! 🎉</h4>
          </div>
          <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
            Parabéns! Todos os recursos PRO foram desbloqueados: catálogo ilimitado, comparador multicanais e simuladores avançados. Boas vendas com lucro real!
          </p>
        </div>
        <button 
          onClick={() => setShowProCelebration(false)} 
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </aside>
    );
  };

  if (currentPath === '/oauth/mercadolivre/callback') {
    return (
      <>
        {renderCelebration()}
        <MercadoLivreCallback />
      </>
    );
  }

  if (currentPath === '/admin') {
    return (
      <>
        {renderCelebration()}
        <AdminDashboard />
      </>
    );
  }

  if (currentPath === '/integracoes') {
    return (
      <>
        {renderCelebration()}
        <MainLayout>
          <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Integrações (OAuth)</h2>
            <MercadoLivreConnect />
          </div>
        </MainLayout>
      </>
    );
  }

  if (currentPath === '/calculadora') {
    return (
      <>
        {renderCelebration()}
        <MainLayout>
          <QuickCalculator />
          <MarketplaceComparator />
        </MainLayout>
      </>
    );
  }

  return (
    <>
      {renderCelebration()}
      <LandingPage />
    </>
  );
}

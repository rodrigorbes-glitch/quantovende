import { useEffect, useState } from 'react';
import { MainLayout } from './ui/layout/MainLayout';
import { QuickCalculator } from './features/quick-mode/QuickCalculator';
import { MarketplaceComparator } from './features/simulators/MarketplaceComparator';
import { LandingPage } from './features/landing/LandingPage';
import MercadoLivreCallback from './pages/oauth/Callback';
import { MercadoLivreConnect } from './features/oauth/MercadoLivreConnect';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', onLocationChange);

    // Sync official rates once when app loads
    import('./store/usePricingStore').then(m => m.usePricingStore.getState().syncOfficialRates());

    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  if (currentPath === '/oauth/mercadolivre/callback') {
    return <MercadoLivreCallback />;
  }

  if (currentPath === '/integracoes') {
    return (
      <MainLayout>
        <div className="p-8 max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Integrações (OAuth)</h2>
          <MercadoLivreConnect />
        </div>
      </MainLayout>
    );
  }

  if (currentPath === '/calculadora') {
    return (
      <MainLayout>
        <QuickCalculator />
        <MarketplaceComparator />
      </MainLayout>
    );
  }

  return <LandingPage />;
}

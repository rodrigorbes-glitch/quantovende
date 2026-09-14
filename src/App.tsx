import { useEffect, useState } from 'react';
import { MainLayout } from './ui/layout/MainLayout';
import { QuickCalculator } from './features/quick-mode/QuickCalculator';
import { MarketplaceComparator } from './features/simulators/MarketplaceComparator';
import { LandingPage } from './features/landing/LandingPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

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

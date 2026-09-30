import { useEffect, useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwa() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Detecta se e dispositivo movel ou tela compacta
    const checkMobile = () => {
      const isMobileDevice = 
        window.innerWidth < 768 || 
        /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Verifica se ja esta rodando como PWA (tela cheia/standalone)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && Boolean((window.navigator as unknown as { standalone: boolean }).standalone));
    
    setIsStandalone(isStandaloneMode);

    // Detecta iOS (iPhone/iPad/iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Verifica se o usuario ja dispensou o banner nesta sessao
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
    setIsDismissed(dismissed);

    // Captura o evento nativo de instalacao do Chrome / Edge / Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const dismissBanner = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return {
    isStandalone,
    isMobile,
    canInstall: !isStandalone && isMobile && (Boolean(deferredPrompt) || isIos),
    triggerInstall,
    dismissBanner,
    isDismissed,
    showIosGuide,
    setShowIosGuide,
  };
}

/**
 * Botao discreto para cabeçalhos / menus exclusivo para Mobile
 */
export function InstallPwaButton({ className = '' }: { className?: string }) {
  const { isStandalone, isMobile, triggerInstall, showIosGuide, setShowIosGuide } = usePwa();

  if (isStandalone || !isMobile) return null;

  return (
    <>
      <button
        onClick={triggerInstall}
        className={`inline-flex md:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 transition-all border border-emerald-500/20 shadow-sm ${className}`}
        title="Instalar QuantoVende no celular"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>

      {showIosGuide && <IosInstallModal onClose={() => setShowIosGuide(false)} />}
    </>
  );
}

/**
 * Banner flutuante inteligente na parte inferior apenas para mobile
 */
export function InstallPwaBanner() {
  const { isStandalone, canInstall, isDismissed, triggerInstall, dismissBanner, showIosGuide, setShowIosGuide } = usePwa();

  if (isStandalone || !canInstall || isDismissed) {
    return showIosGuide ? <IosInstallModal onClose={() => setShowIosGuide(false)} /> : null;
  }

  return (
    <>
      <aside aria-label="Instalar aplicativo" className="fixed bottom-4 left-4 right-4 z-50 md:hidden animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                QuantoVende no Celular
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-medium border border-emerald-500/30">
                  Grátis
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-tight">
                Instale para precificar rápido em feiras e fornecedores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={triggerInstall}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={dismissBanner}
              className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {showIosGuide && <IosInstallModal onClose={() => setShowIosGuide(false)} />}
    </>
  );
}

/**
 * Guia passo a passo elegante para Safari no iOS (iPhone / iPad)
 */
export function IosInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card text-foreground border border-border w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              QV
            </div>
            <div>
              <h3 className="font-bold text-base">Instalar no iPhone</h3>
              <p className="text-xs text-foreground/60">Acesso rápido em 1 toque na tela de início</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-foreground/80 bg-foreground/5 p-4 rounded-2xl border border-border/50">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </div>
            <p className="pt-0.5">
              Toque no ícone de <strong className="text-foreground">Compartilhar</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-primary" /> na barra inferior do Safari.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </div>
            <p className="pt-0.5">
              Role a lista para baixo e toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-primary" />.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </div>
            <p className="pt-0.5">
              Toque em <strong className="text-foreground">"Adicionar"</strong> no canto superior direito. Pronto!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Entendido</span>
        </button>
      </div>
    </div>
  );
}

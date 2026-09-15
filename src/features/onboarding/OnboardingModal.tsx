import { useState, useEffect } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { Card, CardContent } from '../../ui/components/Card';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '../../ui/components/Input'; // Just reusing cn from here if needed

const STEPS = [
  {
    title: 'Bem-vindo ao QuantoVende 👋',
    text: 'Descubra quanto realmente sobra de cada venda — e qual marketplace pode ser mais vantajoso.',
    cta: 'Começar'
  },
  {
    title: '1. Informe seus custos',
    text: 'Produto, marketplace, preço de venda e, se quiser, seus custos adicionais.',
    cta: 'Avançar'
  },
  {
    title: '2. Entenda o resultado',
    text: 'Veja lucro, margem, preço recomendado e compare marketplaces.\n\nSeus dados ficam salvos neste navegador para que você possa fechar o QuantoVende e continuar depois.\nEnquanto a calculadora funciona localmente, seus dados não precisam ser enviados para um servidor.',
    cta: 'Começar a calcular'
  }
];

export function OnboardingModal({ forceOpen = false, onClose }: { forceOpen?: boolean, onClose?: () => void }) {
  const store = usePricingStore();
  const [step, setStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only open automatically if the user hasn't seen it and it's not forced open
    if (!store.hasSeenOnboarding && !forceOpen) {
      setIsOpen(true);
    } else if (forceOpen) {
      setIsOpen(true);
      setStep(0);
    }
  }, [store.hasSeenOnboarding, forceOpen]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleClose(true);
    }
  };

  const handleClose = (markSeen: boolean = false) => {
    if (markSeen && !store.hasSeenOnboarding) {
      store.setHasSeenOnboarding(true);
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-md relative shadow-2xl animate-in zoom-in-95">
        <button 
          onClick={() => handleClose(false)} 
          className="absolute top-4 right-4 text-foreground/40 hover:text-foreground transition-colors p-2"
          aria-label="Fechar introdução"
        >
          <X className="w-5 h-5" />
        </button>
        <CardContent className="pt-10 pb-6 px-6 sm:px-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {STEPS[step].title}
            </h2>
            <div className="text-foreground/70 text-base leading-relaxed space-y-4 whitespace-pre-wrap">
              {STEPS[step].text}
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 px-4 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              {STEPS[step].cta}
              {step < STEPS.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
            <div className="flex justify-center gap-2">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={cn("w-2 h-2 rounded-full transition-all", step === i ? "bg-primary w-4" : "bg-primary/20")}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

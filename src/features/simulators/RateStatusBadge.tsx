import { useState, useRef, useEffect } from 'react';
import { ExternalLink, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export interface RateSourceInfo {
  marketplace: string;
  lastVerifiedAt?: string;
  effectiveFrom?: string;
  sourceType: string;
  sourceUrl?: string;
  status: string;
}

export function RateStatusBadge({ info }: { info: RateSourceInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!info) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-background border border-border/50 text-[10px] font-medium text-foreground/60 hover:text-foreground hover:bg-card transition-colors"
      >
        {info.status === 'ACTIVE' ? (
          <CheckCircle2 className="w-3 h-3 text-success" />
        ) : info.status === 'MANUAL_REVIEW' ? (
          <Clock className="w-3 h-3 text-warning" />
        ) : (
          <AlertTriangle className="w-3 h-3 text-danger" />
        )}
        <span>{info.status === 'ACTIVE' ? 'Taxas de referência' : (info.status === 'MANUAL_REVIEW' ? 'Verificação manual' : 'Alteração detectada')}</span>
      </button>

      {isOpen && (
        <div 
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-card border border-border shadow-xl rounded-lg text-xs font-normal normal-case text-foreground/90 z-50 text-left leading-relaxed animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="space-y-2">
            <p className="font-semibold text-sm">{info.marketplace}</p>
            <p className="text-primary font-medium text-[10px] uppercase tracking-wider">
              {info.status === 'ACTIVE' ? 'Taxas de referência' : (info.status === 'MANUAL_REVIEW' ? 'Verificação manual' : 'Alteração detectada')}
            </p>
            <div className="space-y-1 text-foreground/70">
              {info.lastVerifiedAt && <p>Atualizado em: {new Date(info.lastVerifiedAt).toLocaleDateString('pt-BR')}</p>}
              {info.effectiveFrom && <p>Vigência a partir de: {new Date(info.effectiveFrom).toLocaleDateString('pt-BR')}</p>}
              <p>Fonte: {info.sourceType === 'OFFICIAL_PUBLIC_PAGE' || info.sourceType === 'OFFICIAL_DOCUMENT' ? 'Documentação oficial' : info.sourceType.replace(/_/g, ' ')}</p>
            </div>
            <p className="text-[10px] mt-2 pt-2 border-t border-border/50 text-foreground/60">
              Os valores reais podem variar conforme sua operação e as condições do marketplace.
            </p>
            {info.sourceUrl && (
              <a 
                href={info.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
              >
                Ver fonte oficial <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

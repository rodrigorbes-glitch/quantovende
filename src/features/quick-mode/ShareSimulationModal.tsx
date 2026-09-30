import { useState } from 'react';
import { X, Check, Copy, MessageSquare, Link2, Share2, Sparkles } from 'lucide-react';
import { Button } from '../../ui/components/Button';

interface ShareSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  summaryText: string;
  productName?: string;
  profitFormatted: string;
  margin: number;
}

export function ShareSimulationModal({
  isOpen,
  onClose,
  shareUrl,
  summaryText,
  productName,
  profitFormatted,
  margin,
}: ShareSimulationModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = summaryText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-card text-foreground border border-border w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Compartilhar Simulação</h3>
              <p className="text-xs text-foreground/60">
                Envie o cálculo interativo com seus números prontos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Result Preview Card */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-foreground/60 block">
              {productName ? `Produto: ${productName}` : 'Lucro Líquido Previsto'}
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {profitFormatted}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-foreground/60 block">Margem Líquida</span>
            <span className="text-sm font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              {margin}%
            </span>
          </div>
        </div>

        {/* Direct Link Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-primary" />
            <span>Link Direto da Simulação (Abre com seus dados)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs font-mono text-foreground/80 select-all focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0 h-9 px-3 gap-1.5 font-bold"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
            </Button>
          </div>
        </div>

        {/* WhatsApp & Copy Text Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all hover:scale-[1.02]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 bg-foreground/5 hover:bg-foreground/10 text-foreground font-semibold text-xs py-3 px-4 rounded-xl border border-border transition-colors"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copiedText ? 'Texto Copiado!' : 'Copiar Resumo Completo'}</span>
          </button>
        </div>

        {/* Viral Tip */}
        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-[11px] text-foreground/70 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>
            Quem abrir o link cairá direto na calculadora com esses números exatos e poderá testar alterações na hora!
          </span>
        </div>
      </div>
    </div>
  );
}

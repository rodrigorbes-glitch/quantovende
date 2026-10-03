import { useState } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Percent, 
  Package, 
  FileSpreadsheet, 
  CreditCard,
  ArrowRight,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock
} from 'lucide-react';

interface ProPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProPlansModal({ isOpen, onClose }: ProPlansModalProps) {
  const store = usePricingStore();
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [activationEmail, setActivationEmail] = useState(store.proEmail || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCheckout = () => {
    // Links oficiais Asaas para assinaturas
    const ASAAS_MONTHLY_DEFAULT = 'https://www.asaas.com/000/c/y5ayqjf3pzccrqga';
    const ASAAS_ANNUAL_DEFAULT = 'https://www.asaas.com/000/c/n3z4du1cvj9nkwea';

    const envMonthly = (import.meta as any).env?.VITE_CHECKOUT_URL_MONTHLY || ASAAS_MONTHLY_DEFAULT;
    const envAnnual = (import.meta as any).env?.VITE_CHECKOUT_URL_ANNUAL || ASAAS_ANNUAL_DEFAULT;

    const targetUrl = billingCycle === 'annual' ? envAnnual : envMonthly;

    if (targetUrl) {
      window.open(targetUrl, '_blank');
    } else {
      const msg = encodeURIComponent(
        `Olá! Quero assinar o QuantoVende PRO no plano ${billingCycle === 'annual' ? 'Anual (12x R$ 19,90)' : 'Mensal (R$ 29,90/mês)'}. Como faço para ativar?`
      );
      window.open(`https://wa.me/5521992563548?text=${msg}`, '_blank');
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationEmail) return;
    setIsVerifying(true);
    setVerifyFeedback(null);
    const result = await store.verifyProSubscription(activationEmail);
    setIsVerifying(false);
    if (result.success) {
      setVerifyFeedback({
        type: 'success',
        message: result.message + (result.customerName ? ` Bem-vindo(a), ${result.customerName}!` : '')
      });
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setVerifyFeedback({
        type: 'error',
        message: result.message
      });
    }
  };

  const handleActivateDemo = () => {
    store.setIsProUser(!store.isProUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-card text-foreground border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold tracking-wide uppercase mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Acelere suas Vendas com Lucro Real</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            QuantoVende <span className="text-amber-300">PRO</span>
          </h2>
          <p className="text-sm text-emerald-100 mt-1 max-w-lg">
            A ferramenta completa para quem vende profissionalmente e não aceita mais ter lucro comido por taxas surpresas.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Billing Switcher */}
          <div className="flex items-center justify-center">
            <div className="bg-muted p-1 rounded-2xl flex items-center border border-border/80 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <span>Plano Anual</span>
                <span className="bg-emerald-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                  33% OFF
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Plano Mensal
              </button>
            </div>
          </div>

          {/* Pricing Highlight Box */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-foreground">
                  {billingCycle === 'annual' ? 'R$ 19,90' : 'R$ 29,90'}
                </span>
                <span className="text-xs text-foreground/60 font-medium">/ mês</span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                {billingCycle === 'annual' 
                  ? 'Faturado anualmente em R$ 238,80 (Economize R$ 120 no ano)' 
                  : 'Cobrança mensal flexível, cancele quando quiser'}
              </p>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 group hover:scale-[1.02] cursor-pointer"
            >
              <span>Garantir Acesso PRO</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Selos de Confiança e Segurança Bancária Asaas */}
          <div className="bg-muted/40 border border-border/70 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Pagamento 100% Protegido</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-foreground/60 font-semibold">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  SSL 256-bit
                </span>
                <span>•</span>
                <span>PCI-DSS Nível 1</span>
                <span>•</span>
                <span>Banco Central</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-foreground/80 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">✓</div>
                <span>Processamento Oficial Asaas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">✓</div>
                <span>Cartão em até 12x ou Pix</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">✓</div>
                <span>Ativação Imediata da Conta</span>
              </div>
            </div>
          </div>

          {/* Already a Subscriber? Email Activation */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Já assinou no Asaas? Ative seu acesso com seu e-mail</span>
              </div>
              {store.isProUser && store.proEmail && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Assinatura Ativa
                </span>
              )}
            </div>

            {store.isProUser && store.proEmail ? (
              <div className="text-xs text-foreground/80 flex items-center justify-between pt-1">
                <span>
                  Conectado como <strong className="text-foreground">{store.proEmail}</strong>
                  {store.proExpiresAt && (
                    <span className="text-[11px] text-foreground/60 block sm:inline sm:ml-2">
                      (Válido até {new Date(store.proExpiresAt).toLocaleDateString('pt-BR')})
                    </span>
                  )}
                </span>
                <button 
                  type="button" 
                  onClick={() => store.setProDetails(null, null, null)}
                  className="text-[11px] text-destructive hover:underline font-semibold"
                >
                  Trocar e-mail
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyEmail} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={activationEmail}
                  onChange={(e) => setActivationEmail(e.target.value)}
                  placeholder="Digite o mesmo e-mail da compra no Asaas"
                  className="flex-1 bg-background text-foreground text-xs px-3.5 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <button
                  type="submit"
                  disabled={isVerifying || !activationEmail}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verificando no Asaas...</span>
                    </>
                  ) : (
                    <span>Validar e Liberar PRO</span>
                  )}
                </button>
              </form>
            )}

            {verifyFeedback && (
              <div className={`text-xs p-3 rounded-xl flex items-start gap-2 ${
                verifyFeedback.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20'
              }`}>
                {verifyFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                )}
                <span className="leading-snug">{verifyFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Features Comparison List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60">
              Tudo o que você desbloqueia no PRO:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-foreground/[0.02] border border-border/60">
                <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-foreground">Catálogo Ilimitado</strong>
                  <span className="text-foreground/70">Salve todo seu estoque na nuvem sem limite de 3 itens.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-foreground/[0.02] border border-border/60">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-foreground">Simulador de Kits & Combos</strong>
                  <span className="text-foreground/70">Precifique 1 a 5 unidades diluindo as taxas fixas dos canais.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-foreground/[0.02] border border-border/60">
                <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-foreground">Simulador de Black Friday</strong>
                  <span className="text-foreground/70">Calcule seu desconto máximo sem correr o risco de ter prejuízo.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-foreground/[0.02] border border-border/60">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-foreground">Frete por Peso Automático</strong>
                  <span className="text-foreground/70">Tabelas oficiais de Mercado Livre, Shopee e Amazon por faixa.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-foreground/[0.02] border border-border/60">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-foreground">Relatório PDF & Ficha Técnica</strong>
                  <span className="text-foreground/70">Exporte análises com o nome da sua loja para equipe e sócios.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-foreground/[0.02] border border-border/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-foreground">Auditoria de Prejuízo Oculto</strong>
                  <span className="text-foreground/70">Alerta visual instantâneo quando uma taxa comer seu lucro.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof / ROI Argument */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-3">
            <span className="text-xl shrink-0">💡</span>
            <div className="space-y-1">
              <strong className="font-bold text-foreground">Por que o QuantoVende PRO se paga sozinho?</strong>
              <p className="text-foreground/80 leading-relaxed">
                Vender um único item com frete ou taxa de R$ 79,00 calculada errado no Mercado Livre gera mais de R$ 30,00 de prejuízo direto. O QuantoVende PRO evita esse erro na sua primeira simulação.
              </p>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3 text-[11px] text-foreground/60">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Garantia incondicional de 7 dias</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Pagamento seguro via Pix ou Cartão em até 12x</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cancele a qualquer momento com 1 clique</span>
            </div>
          </div>
        </div>

        {/* Dev only toggle */}
        {import.meta.env.DEV && (
          <div className="bg-muted/40 px-6 py-3 border-t border-border flex items-center justify-between text-[11px] text-foreground/50">
            <span>Ambiente de Desenvolvimento</span>
            <button
              onClick={handleActivateDemo}
              className="hover:text-foreground underline transition-colors"
            >
              {store.isProUser ? 'Desativar Status PRO (Dev)' : 'Ativar PRO (Dev)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

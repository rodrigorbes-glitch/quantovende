import { useState } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { 
  X, 
  User, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  LogOut, 
  Store, 
  Check, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlans?: () => void;
}

export function UserProfileModal({ isOpen, onClose, onOpenPlans }: UserProfileModalProps) {
  const store = usePricingStore();
  const [emailInput, setEmailInput] = useState(store.proEmail || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Store Brand state
  const [storeNameInput, setStoreNameInput] = useState(store.proStoreName || '');
  const [storeSavedFeedback, setStoreSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setIsVerifying(true);
    setFeedback(null);

    const result = await store.verifyProSubscription(emailInput);
    setIsVerifying(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: result.message + (result.customerName ? ` Olá, ${result.customerName}!` : '')
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setFeedback({
        type: 'error',
        message: result.message
      });
    }
  };

  const handleSaveStoreName = (e: React.FormEvent) => {
    e.preventDefault();
    store.setProStoreName(storeNameInput.trim() || null);
    setStoreSavedFeedback(true);
    setTimeout(() => setStoreSavedFeedback(false), 2000);
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente desconectar sua conta PRO deste aparelho?')) {
      store.logoutPro();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-card text-foreground border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white relative flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <User className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>{store.isProUser ? 'Minha Conta' : 'Entrar no QuantoVende'}</span>
                {store.isProUser && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                    PRO
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-white/60">
                {store.isProUser ? 'Gerencie seu plano e dados da sua loja' : 'Acesse com seu e-mail cadastrado'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {store.isProUser ? (
            /* Logged In - PRO Profile View */
            <div className="space-y-5">
              {/* Account Status Card */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/70 font-medium">Status da Assinatura:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Ativa
                  </span>
                </div>
                <div className="text-xs text-foreground/90">
                  <span className="block text-[11px] text-foreground/50">E-mail conectado:</span>
                  <strong className="text-sm font-semibold">{store.proEmail}</strong>
                </div>
                {store.proExpiresAt && (
                  <div className="text-[11px] text-foreground/60 pt-1 border-t border-emerald-500/20">
                    Válido até: <strong>{new Date(store.proExpiresAt).toLocaleDateString('pt-BR')}</strong>
                  </div>
                )}
              </div>

              {/* Custom Store Branding Form */}
              <form onSubmit={handleSaveStoreName} className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Identidade da sua Loja (Relatórios PDF)</span>
                </div>
                <p className="text-[11px] text-foreground/60 leading-relaxed">
                  Defina o nome da sua marca para sair impresso nos relatórios e fichas técnicas de precificação:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={storeNameInput}
                    onChange={(e) => setStoreNameInput(e.target.value)}
                    placeholder="Ex: Minha Loja E-commerce"
                    className="flex-1 bg-background text-foreground text-xs px-3.5 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shrink-0 flex items-center gap-1"
                  >
                    {storeSavedFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvo!</span>
                      </>
                    ) : (
                      <span>Salvar</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Disconnect Action */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-destructive hover:bg-destructive/10 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair / Desconectar deste aparelho</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out - Login Form */
            <div className="space-y-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span>E-mail da assinatura no Asaas</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-background text-foreground text-sm px-3.5 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !emailInput}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando assinatura...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar e Liberar Acesso PRO</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {feedback && (
                <div className={`text-xs p-3.5 rounded-xl flex items-start gap-2.5 ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20'
                }`}>
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className="leading-relaxed">{feedback.message}</span>
                </div>
              )}

              {/* Call to buy if not subscribed */}
              <div className="pt-3 border-t border-border text-center space-y-2">
                <p className="text-xs text-foreground/60">Ainda não possui uma assinatura?</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenPlans) onOpenPlans();
                    else store.setProModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Conhecer os planos QuantoVende PRO</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

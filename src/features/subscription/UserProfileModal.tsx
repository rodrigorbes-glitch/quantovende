import { useState } from 'react';
import { usePricingStore } from '../../store/usePricingStore';
import { supabase } from '../../core/supabase/client';
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
  ArrowLeft,
  ShieldCheck, 
  Crown, 
  KeyRound, 
  Eye, 
  EyeOff, 
  MessageCircle,
  Lock
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlans?: () => void;
}

export function UserProfileModal({ isOpen, onClose, onOpenPlans }: UserProfileModalProps) {
  const store = usePricingStore();
  const [emailInput, setEmailInput] = useState(store.proEmail || '');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Store Brand state
  const [storeNameInput, setStoreNameInput] = useState(store.proStoreName || '');
  const [storeSavedFeedback, setStoreSavedFeedback] = useState(false);

  // User Password States (Inside Logged-in Profile)
  const [isChangingUserPwd, setIsChangingUserPwd] = useState(false);
  const [userCurrPwd, setUserCurrPwd] = useState('');
  const [userNewPwd, setUserNewPwd] = useState('');
  const [showUserCurrPwd, setShowUserCurrPwd] = useState(false);
  const [showUserNewPwd, setShowUserNewPwd] = useState(false);
  const [userPwdFeedback, setUserPwdFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSavingUserPwd, setIsSavingUserPwd] = useState(false);

  // Recovery Mode State (When user clicks "Esqueceu a senha?")
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Token Reset Form
  const [recoveryToken, setRecoveryToken] = useState('');
  const [recoveryNewPwd, setRecoveryNewPwd] = useState('');
  const [showRecoveryNewPwd, setShowRecoveryNewPwd] = useState(false);
  const [isResettingWithToken, setIsResettingWithToken] = useState(false);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setIsVerifying(true);
    setFeedback(null);

    const result = await store.verifyProSubscription(emailInput, loginPasswordInput);
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

  const handleGoogleLogin = async () => {
    if (!supabase) {
      alert('Autenticação indisponível.');
      return;
    }
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        throw new Error('O login com Google precisa ser ativado no painel do Supabase com as credenciais do Google Cloud.');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erro ao conectar com Google.'
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToRecover = (recoveryEmail || emailInput).trim().toLowerCase();
    if (!emailToRecover || !emailToRecover.includes('@')) {
      setRecoveryFeedback({ type: 'error', message: 'Digite um e-mail válido.' });
      return;
    }

    setIsSendingRecovery(true);
    setRecoveryFeedback(null);

    try {
      if (!supabase) throw new Error('Serviço indisponível.');

      // 1. Tenta enviar pelo Supabase Auth oficial
      try {
        await supabase.auth.resetPasswordForEmail(emailToRecover, {
          redirectTo: window.location.origin
        });
      } catch (authErr) {
        console.warn('Supabase Auth reset aviso:', authErr);
      }

      // 2. Dispara a rotina de recuperação via RPC
      const { data, error } = await supabase.rpc('user_request_password_reset', {
        p_email: emailToRecover
      });

      if (error) throw error;

      if (data && !data.success) {
        setRecoveryFeedback({ type: 'error', message: data.message });
      } else {
        setRecoverySent(true);
        setRecoveryFeedback({ 
          type: 'success', 
          message: 'Solicitação de recuperação gerada! Se tiver o código de 6 dígitos recebido, digite-o abaixo junto com sua nova senha.' 
        });
      }
    } catch (err: any) {
      setRecoveryFeedback({ type: 'error', message: err.message || 'Falha ao solicitar recuperação.' });
    } finally {
      setIsSendingRecovery(false);
    }
  };

  const handleResetPasswordWithToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToRecover = (recoveryEmail || emailInput).trim().toLowerCase();
    if (!recoveryToken || !recoveryNewPwd) return;

    if (recoveryNewPwd.length < 4) {
      setRecoveryFeedback({ type: 'error', message: 'A nova senha deve ter no mínimo 4 caracteres.' });
      return;
    }

    setIsResettingWithToken(true);
    setRecoveryFeedback(null);

    try {
      if (!supabase) throw new Error('Serviço indisponível.');
      const { data, error } = await supabase.rpc('user_reset_password_with_token', {
        p_email: emailToRecover,
        p_token: recoveryToken.trim(),
        p_new_password: recoveryNewPwd.trim()
      });

      if (error) throw error;

      if (data && !data.success) {
        setRecoveryFeedback({ type: 'error', message: data.message });
      } else {
        setRecoveryFeedback({ type: 'success', message: data.message || 'Senha redefinida com sucesso!' });
        setTimeout(() => {
          setIsRecoveryMode(false);
          setRecoverySent(false);
          setRecoveryToken('');
          setRecoveryNewPwd('');
          setLoginPasswordInput('');
          setRecoveryFeedback(null);
        }, 2000);
      }
    } catch (err: any) {
      setRecoveryFeedback({ type: 'error', message: err.message || 'Erro ao redefinir senha.' });
    } finally {
      setIsResettingWithToken(false);
    }
  };

  const handleSaveStoreName = (e: React.FormEvent) => {
    e.preventDefault();
    store.setProStoreName(storeNameInput.trim() || null);
    setStoreSavedFeedback(true);
    setTimeout(() => setStoreSavedFeedback(false), 2000);
  };

  const handleSaveUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserPwdFeedback(null);
    if (!store.proEmail || !supabase) return;

    if (userNewPwd.length < 4) {
      setUserPwdFeedback({ type: 'error', message: 'A nova senha deve ter no mínimo 4 caracteres.' });
      return;
    }

    setIsSavingUserPwd(true);
    try {
      const { data, error } = await supabase.rpc('user_set_password', {
        p_email: store.proEmail,
        p_current_password: userCurrPwd || null,
        p_new_password: userNewPwd
      });

      if (error) throw error;
      if (data && !data.success) {
        setUserPwdFeedback({ type: 'error', message: data.message });
      } else {
        setUserPwdFeedback({ type: 'success', message: 'Senha salva com sucesso!' });
        setUserCurrPwd('');
        setUserNewPwd('');
        setTimeout(() => {
          setIsChangingUserPwd(false);
          setUserPwdFeedback(null);
        }, 1800);
      }
    } catch (err: any) {
      setUserPwdFeedback({ type: 'error', message: err.message || 'Erro ao salvar senha.' });
    } finally {
      setIsSavingUserPwd(false);
    }
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
        className="bg-card text-foreground border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white relative flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <User className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>
                  {store.isProUser 
                    ? 'Minha Conta' 
                    : isRecoveryMode 
                    ? 'Recuperar Acesso' 
                    : 'Entrar no QuantoVende'}
                </span>
                {store.isProUser && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                    PRO
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-white/60">
                {store.isProUser 
                  ? 'Gerencie seu plano e segurança' 
                  : isRecoveryMode 
                  ? 'Redefina sua senha ou recupere sua assinatura' 
                  : 'Acesse com seu e-mail e senha cadastrados'}
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
        <div className="p-6 overflow-y-auto space-y-6">
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
                  Defina o nome da sua marca para sair impresso nos relatórios e fichas técnicas:
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

              {/* Password Setting Section for User */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-foreground">Senha da Conta</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangingUserPwd(!isChangingUserPwd)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {isChangingUserPwd ? 'Fechar' : 'Alterar Senha'}
                  </button>
                </div>

                {isChangingUserPwd ? (
                  <form onSubmit={handleSaveUserPassword} className="space-y-3 pt-2">
                    {userPwdFeedback && (
                      <div className={`text-xs p-2.5 rounded-xl flex items-center gap-2 ${
                        userPwdFeedback.type === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {userPwdFeedback.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        <span>{userPwdFeedback.message}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground/70">Senha Atual (se já possuir)</label>
                      <div className="relative">
                        <input
                          type={showUserCurrPwd ? 'text' : 'password'}
                          value={userCurrPwd}
                          onChange={(e) => setUserCurrPwd(e.target.value)}
                          placeholder="Digite sua senha atual"
                          className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUserCurrPwd(!showUserCurrPwd)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1 transition-colors"
                          title={showUserCurrPwd ? 'Ocultar' : 'Visualizar'}
                        >
                          {showUserCurrPwd ? <EyeOff className="w-4 h-4 stroke-[1.5]" /> : <Eye className="w-4 h-4 stroke-[1.5]" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground/70">Nova Senha</label>
                      <div className="relative">
                        <input
                          type={showUserNewPwd ? 'text' : 'password'}
                          required
                          value={userNewPwd}
                          onChange={(e) => setUserNewPwd(e.target.value)}
                          placeholder="Mínimo 4 caracteres"
                          className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUserNewPwd(!showUserNewPwd)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1 transition-colors"
                          title={showUserNewPwd ? 'Ocultar' : 'Visualizar'}
                        >
                          {showUserNewPwd ? <EyeOff className="w-4 h-4 stroke-[1.5]" /> : <Eye className="w-4 h-4 stroke-[1.5]" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingUserPwd || !userNewPwd}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                    >
                      {isSavingUserPwd ? 'Salvando...' : 'Salvar Nova Senha'}
                    </button>
                  </form>
                ) : (
                  <p className="text-[11px] text-foreground/60">
                    Defina uma senha individual para proteger seu acesso em outros computadores e dispositivos.
                  </p>
                )}
              </div>

              {/* Admin Panel Shortcut (Only visible for admin) */}
              {store.proEmail === 'rodrigorbes@gmail.com' && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/admin';
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all hover:scale-[1.01]"
                >
                  <Crown className="w-4 h-4" />
                  <span>Acessar Painel Administrativo (Admin)</span>
                </button>
              )}

              {/* Disconnect Action */}
              <div className="pt-1 flex justify-end">
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
          ) : isRecoveryMode ? (
            /* Password Recovery Screen */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-foreground">Recuperação Automática de Senha</h4>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  Informe o e-mail cadastrado na sua assinatura para gerarmos a recuperação de acesso.
                </p>
              </div>

              {recoveryFeedback && (
                <div className={`text-xs p-3 rounded-xl flex items-start gap-2.5 ${
                  recoveryFeedback.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {recoveryFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className="leading-relaxed">{recoveryFeedback.message}</span>
                </div>
              )}

              {!recoverySent ? (
                <form onSubmit={handleRequestRecovery} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>E-mail da assinatura</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={recoveryEmail || emailInput}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-background text-foreground text-sm px-3.5 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingRecovery}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isSendingRecovery ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando solicitação...</span>
                      </>
                    ) : (
                      <span>Enviar Link / Código de Recuperação</span>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Enter token & new password */
                <form onSubmit={handleResetPasswordWithToken} className="space-y-3 pt-2 border-t border-border">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Código de Recuperação (6 dígitos)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={recoveryToken}
                      onChange={(e) => setRecoveryToken(e.target.value)}
                      placeholder="Ex: 123456"
                      className="w-full bg-background text-foreground text-center font-mono text-base tracking-widest py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Digite a Nova Senha</label>
                    <div className="relative">
                      <input
                        type={showRecoveryNewPwd ? 'text' : 'password'}
                        required
                        value={recoveryNewPwd}
                        onChange={(e) => setRecoveryNewPwd(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryNewPwd(!showRecoveryNewPwd)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1"
                        title={showRecoveryNewPwd ? 'Ocultar' : 'Visualizar'}
                      >
                        {showRecoveryNewPwd ? <EyeOff className="w-4 h-4 stroke-[1.5]" /> : <Eye className="w-4 h-4 stroke-[1.5]" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isResettingWithToken || !recoveryToken || !recoveryNewPwd}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isResettingWithToken ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Redefinindo senha...</span>
                      </>
                    ) : (
                      <span>Confirmar e Salvar Nova Senha</span>
                    )}
                  </button>
                </form>
              )}

              {/* Direct WhatsApp help option */}
              <div className="p-3 rounded-2xl bg-muted/40 border border-border text-xs space-y-1.5 text-center">
                <span className="text-[11px] text-foreground/60 block">Precisa de suporte imediato ou alteração de e-mail?</span>
                <a
                  href="https://wa.me/5521992563548?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20para%20recuperar%20meu%20acesso%20no%20QuantoVende."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Falar com Atendimento no WhatsApp</span>
                </a>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(false);
                    setRecoverySent(false);
                    setRecoveryFeedback(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/60 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out - Login Form */
            <div className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span>E-mail da assinatura</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-background text-foreground text-sm px-3.5 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span>Senha de Acesso</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryMode(true);
                        setRecoveryEmail(emailInput);
                        setRecoveryFeedback(null);
                      }}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPasswordInput}
                      onChange={(e) => setLoginPasswordInput(e.target.value)}
                      placeholder={showLoginPassword ? 'Digite sua senha' : '••••••••'}
                      className="w-full bg-background text-foreground text-sm pl-3.5 pr-10 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1 transition-colors"
                      title={showLoginPassword ? 'Ocultar senha' : 'Ver senha digitada'}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4 stroke-[1.5]" />
                      ) : (
                        <Eye className="w-4 h-4 stroke-[1.5]" />
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] text-foreground/50 block">
                    Se for seu primeiro acesso após assinar, crie sua senha digitando-a acima.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !emailInput}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando acesso...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no QuantoVende PRO</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Google OAuth Login Button */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-foreground/50 font-bold">ou continue com</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-2.5 bg-background hover:bg-muted/60 text-foreground border border-border/80 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isGoogleLoading ? 'Conectando...' : 'Continuar com o Google'}</span>
              </button>

              {feedback && (
                <div className={`text-xs p-3.5 rounded-xl flex items-start gap-2.5 ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className="leading-relaxed">{feedback.message}</span>
                </div>
              )}

              {/* Call to buy if not subscribed */}
              <div className="pt-2 border-t border-border text-center space-y-1">
                <p className="text-[11px] text-foreground/50">Ainda não possui uma assinatura?</p>
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

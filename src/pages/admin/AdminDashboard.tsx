import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../core/supabase/client';
import { MainLayout } from '../../ui/layout/MainLayout';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  DollarSign, 
  UserPlus, 
  ShieldAlert, 
  Search, 
  ShieldCheck, 
  X,
  CreditCard,
  Crown,
  ArrowLeft,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { MercadoLivreConnect } from '../../features/oauth/MercadoLivreConnect';

interface SubscriptionRow {
  id: string;
  email: string;
  customer_name: string | null;
  status: string;
  billing_type: string | null;
  value: number | string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  asaas_payment_id: string | null;
}

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('qv_admin_authenticated') === 'true';
  });
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return sessionStorage.getItem('qv_admin_email') || 'rodrigorbes@gmail.com';
  });
  const [adminSecret, setAdminSecret] = useState<string>(() => {
    return sessionStorage.getItem('qv_admin_secret') || '';
  });

  // Login form states
  const [loginEmail, setLoginEmail] = useState(adminEmail);
  const [loginSecret, setLoginSecret] = useState('');
  const [showLoginSecret, setShowLoginSecret] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Change Password Modal States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrPwd, setShowCurrPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPwd !== confirmPwd) {
      setPwdError('A nova senha e a confirmação não coincidem.');
      return;
    }
    if (newPwd.length < 4) {
      setPwdError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    setIsSavingPwd(true);
    try {
      if (!supabase) throw new Error('Supabase não conectado.');
      const { error } = await supabase.rpc('admin_change_password', {
        p_admin_email: adminEmail,
        p_current_secret: currPwd,
        p_new_secret: newPwd
      });

      if (error) throw error;

      sessionStorage.setItem('qv_admin_secret', newPwd);
      setAdminSecret(newPwd);
      setPwdSuccess('Senha master alterada com sucesso!');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setCurrPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setPwdSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPwdError(err.message || 'Falha ao alterar senha.');
    } finally {
      setIsSavingPwd(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'subscriptions' | 'integrations'>('subscriptions');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for Manual Subscriber
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formPlan, setFormPlan] = useState<'monthly' | 'annual' | 'lifetime'>('monthly');
  const [formBilling, setFormBilling] = useState('PIX_WHATSAPP');
  const [isSavingSub, setIsSavingSub] = useState(false);

  // Integrations / Rate Intelligence State
  const [credentials, setCredentials] = useState<any[]>([]);
  const [rateVersions, setRateVersions] = useState<any[]>([]);

  async function fetchAllData(email = adminEmail, secret = adminSecret) {
    if (!supabase || !isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const [subsRes, credsRes, ratesRes] = await Promise.all([
        supabase.rpc('get_admin_subscriptions', {
          p_admin_email: email,
          p_admin_secret: secret
        }),
        supabase.rpc('get_admin_oauth_status'),
        supabase.from('marketplace_rate_versions').select('id, version, status, created_at, marketplace_rate_profiles!profile_id(marketplace)').order('created_at', { ascending: false }).limit(10)
      ]);

      if (subsRes.error) {
        console.error('RPC Error:', subsRes.error);
        if (subsRes.error.message.includes('Acesso Negado')) {
          handleLogout();
          return;
        }
      }

      if (subsRes.data) setSubscriptions(subsRes.data);
      if (credsRes.data) setCredentials(credsRes.data);
      if (ratesRes.data) setRateVersions(ratesRes.data);
    } catch (err: any) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated && adminEmail && adminSecret) {
      fetchAllData(adminEmail, adminSecret);
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanSecret = loginSecret.trim();

    try {
      if (!supabase) {
        throw new Error('Supabase não conectado.');
      }

      const { data, error } = await supabase.rpc('get_admin_subscriptions', {
        p_admin_email: cleanEmail,
        p_admin_secret: cleanSecret
      });

      if (error || !data) {
        throw new Error(error?.message || 'Credenciais inválidas.');
      }

      sessionStorage.setItem('qv_admin_authenticated', 'true');
      sessionStorage.setItem('qv_admin_email', cleanEmail);
      sessionStorage.setItem('qv_admin_secret', cleanSecret);

      setAdminEmail(cleanEmail);
      setAdminSecret(cleanSecret);
      setIsAuthenticated(true);
      setSubscriptions(data);

      const [credsRes, ratesRes] = await Promise.all([
        supabase.rpc('get_admin_oauth_status'),
        supabase.from('marketplace_rate_versions').select('id, version, status, created_at, marketplace_rate_profiles!profile_id(marketplace)').order('created_at', { ascending: false }).limit(10)
      ]);
      if (credsRes.data) setCredentials(credsRes.data);
      if (ratesRes.data) setRateVersions(ratesRes.data);

    } catch (err: any) {
      setAuthError('Acesso Negado: E-mail ou senha administrativa incorretos.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('qv_admin_authenticated');
    sessionStorage.removeItem('qv_admin_email');
    sessionStorage.removeItem('qv_admin_secret');
    setIsAuthenticated(false);
    setAdminSecret('');
    setLoginSecret('');
    setSubscriptions([]);
    setCredentials([]);
    setRateVersions([]);
  };

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery.trim()) return subscriptions;
    const q = searchQuery.toLowerCase().trim();
    return subscriptions.filter(s => 
      s.email?.toLowerCase().includes(q) || 
      (s.customer_name && s.customer_name.toLowerCase().includes(q))
    );
  }, [subscriptions, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const active = subscriptions.filter(s => s.status === 'active' && new Date(s.expires_at) > now);
    const expiredOrCanceled = subscriptions.filter(s => s.status !== 'active' || new Date(s.expires_at) <= now);
    const mrr = active.reduce((acc, curr) => acc + (Number(curr.value) > 0 ? Number(curr.value) : 29.90), 0);

    return {
      total: subscriptions.length,
      activeCount: active.length,
      inactiveCount: expiredOrCanceled.length,
      estimatedMrr: mrr
    };
  }, [subscriptions]);

  // Action: Toggle subscriber status (Active <-> Canceled)
  const handleToggleStatus = async (sub: SubscriptionRow) => {
    if (!supabase) return;
    const newStatus = sub.status === 'active' ? 'canceled' : 'active';
    const confirmMsg = newStatus === 'canceled' 
      ? `Deseja realmente bloquear/cancelar o acesso de ${sub.email}?` 
      : `Deseja reativar o acesso de ${sub.email}?`;

    if (!window.confirm(confirmMsg)) return;

    const { error } = await supabase.rpc('admin_toggle_subscription_status', {
      p_admin_email: adminEmail,
      p_admin_secret: adminSecret,
      p_email: sub.email,
      p_new_status: newStatus
    });

    if (error) {
      alert(`Erro: ${error.message}`);
    } else {
      fetchAllData();
    }
  };

  // Action: Extend validity (+30d, +365d, lifetime)
  const handleExtendValidity = async (email: string, days: number) => {
    if (!supabase) return;
    const label = days >= 30000 ? 'Vitalício' : `+${days} dias`;
    if (!window.confirm(`Confirmar extensão de validade (${label}) para ${email}?`)) return;

    const { error } = await supabase.rpc('admin_extend_subscription', {
      p_admin_email: adminEmail,
      p_admin_secret: adminSecret,
      p_email: email,
      p_days: days
    });

    if (error) {
      alert(`Erro: ${error.message}`);
    } else {
      fetchAllData();
    }
  };

  // Action: Submit Manual Subscriber
  const handleAddManualSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !formEmail) return;
    setIsSavingSub(true);

    try {
      const now = new Date();
      let expiresAt = new Date();
      let planValue = 29.90;

      if (formPlan === 'monthly') {
        expiresAt.setDate(now.getDate() + 35);
        planValue = 29.90;
      } else if (formPlan === 'annual') {
        expiresAt.setDate(now.getDate() + 375);
        planValue = 238.80;
      } else {
        expiresAt = new Date('2099-12-31T23:59:59Z');
        planValue = 0;
      }

      const { error } = await supabase.rpc('admin_upsert_subscription', {
        p_admin_email: adminEmail,
        p_admin_secret: adminSecret,
        p_email: formEmail.trim().toLowerCase(),
        p_name: formName.trim() || 'Assinante Manual',
        p_status: 'active',
        p_billing_type: formBilling,
        p_expires_at: expiresAt.toISOString(),
        p_value: planValue
      });

      if (error) throw error;

      setIsAddModalOpen(false);
      setFormEmail('');
      setFormName('');
      fetchAllData();
      alert('Assinante cadastrado e liberado com sucesso!');
    } catch (err: any) {
      alert(`Falha ao cadastrar: ${err.message}`);
    } finally {
      setIsSavingSub(false);
    }
  };

  // Sync Rate Intelligence Handler
  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const res = await fetch(`${supabaseUrl}/functions/v1/rate-intelligence-update`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-admin-trigger': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao sincronizar');
      }

      setSyncMessage({ type: 'success', text: 'Sincronização concluída com sucesso!' });
      await fetchAllData();
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: err.message || 'Falha na sincronização' });
    } finally {
      setSyncing(false);
    }
  };

  // If not authenticated, render the high-security lock screen
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-[75vh] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 border-border/80 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500" />
            
            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                Área Restrita do Proprietário
              </h1>
              <p className="text-xs text-foreground/60 leading-relaxed max-w-xs mx-auto">
                Acesso estritamente restrito. Digite suas credenciais master para desbloquear o painel administrativo.
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">E-mail Master</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="rodrigorbes@gmail.com"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Senha Master</label>
                <div className="relative">
                  <input
                    type={showLoginSecret ? 'text' : 'password'}
                    required
                    autoFocus
                    value={loginSecret}
                    onChange={(e) => setLoginSecret(e.target.value)}
                    placeholder={showLoginSecret ? 'Digite sua senha' : '••••••••'}
                    className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginSecret(!showLoginSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground p-1 transition-colors"
                    title={showLoginSecret ? 'Ocultar senha' : 'Ver senha digitada'}
                  >
                    {showLoginSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn || !loginSecret}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando Credenciais...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Desbloquear Painel</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border/60 text-center">
              <button
                type="button"
                onClick={() => { window.location.href = '/calculadora'; }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/50 hover:text-foreground transition-colors group cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Voltar para a Calculadora</span>
              </button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Back Link */}
        <div>
          <button
            onClick={() => { window.location.href = '/calculadora'; }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/60 hover:text-foreground transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para a Calculadora</span>
          </button>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase mb-2 border border-amber-500/20">
              <Crown className="w-3.5 h-3.5" />
              <span>Painel do Proprietário</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              QuantoVende Central
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              Gestão de assinantes, receita, liberações manuais e integridade do motor de taxas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => fetchAllData()}
              disabled={loading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </Button>

            <Button 
              variant="outline"
              size="sm"
              onClick={() => setIsChangePasswordOpen(true)}
              className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground"
              title="Trocar senha administrativa"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Senha</span>
            </Button>

            <Button 
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-rose-600 border-rose-500/20 hover:bg-rose-500/10"
              title="Bloquear painel e sair da sessão"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </Button>

            {activeTab === 'subscriptions' && (
              <Button
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Ativar Assinante Manual</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border gap-2">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'subscriptions'
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/60 hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Assinantes & Faturamento ({metrics.total})</span>
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'integrations'
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/60 hover:text-foreground'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Motor de Taxas & OAuth</span>
          </button>
        </div>

        {/* TAB 1: SUBSCRIPTIONS & REVENUE */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 bg-card border-border">
                <div className="flex items-center justify-between text-xs text-foreground/60 font-semibold uppercase">
                  <span>Assinantes Ativos</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-foreground mt-2">
                  {metrics.activeCount}
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
                  Acesso liberado e validado
                </span>
              </Card>

              <Card className="p-5 bg-card border-border">
                <div className="flex items-center justify-between text-xs text-foreground/60 font-semibold uppercase">
                  <span>MRR Estimado</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-foreground mt-2">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.estimatedMrr)}
                </div>
                <span className="text-xs text-foreground/50 font-medium mt-1 block">
                  Receita mensal recorrente
                </span>
              </Card>

              <Card className="p-5 bg-card border-border">
                <div className="flex items-center justify-between text-xs text-foreground/60 font-semibold uppercase">
                  <span>Vencidos / Cancelados</span>
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-black text-foreground mt-2">
                  {metrics.inactiveCount}
                </div>
                <span className="text-xs text-foreground/50 font-medium mt-1 block">
                  Sem acesso ativo no momento
                </span>
              </Card>

              <Card className="p-5 bg-card border-border">
                <div className="flex items-center justify-between text-xs text-foreground/60 font-semibold uppercase">
                  <span>Total Histórico</span>
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="text-3xl font-black text-foreground mt-2">
                  {metrics.total}
                </div>
                <span className="text-xs text-foreground/50 font-medium mt-1 block">
                  Clientes cadastrados
                </span>
              </Card>
            </div>

            {/* Search Bar & Table Card */}
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por e-mail ou nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <span className="text-xs text-foreground/50 self-end sm:self-center">
                  Exibindo {filteredSubscriptions.length} assinante(s)
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-border rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-foreground/70 uppercase tracking-wider text-[11px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Origem / Pagamento</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Validade</th>
                      <th className="py-3 px-4 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-foreground/50">
                          Nenhum assinante encontrado para esta busca.
                        </td>
                      </tr>
                    ) : (
                      filteredSubscriptions.map((sub) => {
                        const isExpired = new Date(sub.expires_at) <= new Date();
                        const isActive = sub.status === 'active' && !isExpired;
                        const isLifetime = new Date(sub.expires_at).getFullYear() > 2090;

                        return (
                          <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4">
                              <strong className="block font-semibold text-foreground text-sm">
                                {sub.customer_name || 'Sem nome informado'}
                              </strong>
                              <span className="text-foreground/70 font-mono text-[11px]">{sub.email}</span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-foreground/50" />
                                <span className="font-medium text-foreground/80 uppercase">
                                  {sub.billing_type || (sub.asaas_payment_id ? 'Asaas' : 'Manual')}
                                </span>
                              </div>
                              <span className="text-[10px] text-foreground/50 block">
                                {sub.asaas_payment_id ? `ID: ${sub.asaas_payment_id}` : 'Liberado Manualmente'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                isActive 
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                {isActive ? 'Ativo' : isExpired ? 'Vencido' : 'Cancelado'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {isLifetime ? (
                                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <Crown className="w-3.5 h-3.5" />
                                  Vitalício
                                </span>
                              ) : (
                                <div>
                                  <span className="font-semibold text-foreground">
                                    {new Date(sub.expires_at).toLocaleDateString('pt-BR')}
                                  </span>
                                  <span className="text-[10px] text-foreground/50 block">
                                    {isExpired ? 'Expirou' : 'Renovação programada'}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleToggleStatus(sub)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                    sub.status === 'active'
                                      ? 'text-rose-600 hover:bg-rose-500/10 border border-rose-500/20'
                                      : 'text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20'
                                  }`}
                                  title={sub.status === 'active' ? 'Bloquear conta' : 'Reativar conta'}
                                >
                                  {sub.status === 'active' ? 'Bloquear' : 'Reativar'}
                                </button>

                                <button
                                  onClick={() => handleExtendValidity(sub.email, 30)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-foreground/70 hover:text-foreground border border-border hover:bg-muted/50 transition-colors"
                                  title="Adicionar 30 dias de validade"
                                >
                                  +30d
                                </button>

                                <button
                                  onClick={() => handleExtendValidity(sub.email, 365)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors"
                                  title="Adicionar 1 ano de validade"
                                >
                                  +1 ano
                                </button>

                                <button
                                  onClick={() => handleExtendValidity(sub.email, 35000)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-600 hover:bg-amber-500/10 border border-amber-500/20 transition-colors"
                                  title="Tornar Vitalício"
                                >
                                  👑
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: RATE INTELLIGENCE & OAUTH */}
        {activeTab === 'integrations' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border">
              <div>
                <h3 className="font-bold text-sm text-foreground">Sincronizador Automático de Taxas</h3>
                <p className="text-xs text-foreground/60">Dispare a coleta imediata dos perfis oficiais de taxas de ML e Amazon.</p>
              </div>
              <Button 
                onClick={handleSyncNow} 
                disabled={syncing}
                size="sm"
                className="flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </Button>
            </div>

            {syncMessage && (
              <div className={`p-4 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                syncMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
              }`}>
                {syncMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{syncMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Contas OAuth Conectadas
                </h2>
                {credentials.length === 0 ? (
                  <p className="text-xs text-foreground/50">Nenhuma conta conectada.</p>
                ) : (
                  <div className="space-y-3">
                    {credentials.map(c => (
                      <div key={c.marketplace + c.seller_user_id} className="p-3.5 border border-border rounded-xl bg-muted/20">
                        <div className="font-bold text-foreground text-sm capitalize">{c.marketplace}</div>
                        <div className="text-xs text-foreground/60 font-mono">Seller ID: {c.seller_user_id}</div>
                        <div className="text-[11px] text-foreground/40 mt-1">
                          Último Refresh: {new Date(c.updated_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  Histórico de Versões de Taxas
                </h2>
                {rateVersions.length === 0 ? (
                  <p className="text-xs text-foreground/50">Nenhuma taxa coletada ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {rateVersions.map(v => (
                      <div key={v.id} className="p-3 border border-border rounded-xl bg-muted/20 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-foreground text-xs capitalize">{v.marketplace_rate_profiles?.marketplace || 'Desconhecido'}</div>
                          <div className="text-[11px] font-mono text-foreground/50">Versão: {v.version}</div>
                          <div className="text-[10px] text-foreground/40 mt-0.5">
                            {new Date(v.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            v.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-muted text-foreground/50'
                          }`}>
                            {v.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Conexão OAuth Mercado Livre */}
            <div className="pt-6 border-t border-border">
              <h3 className="font-bold text-sm text-foreground mb-4">Conectar Nova Conta Oficial Mercado Livre (OAuth)</h3>
              <div className="max-w-md">
                <MercadoLivreConnect />
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADICIONAR ASSINANTE MANUAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div 
              className="bg-card text-foreground border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Ativar Assinante Manual</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">Libere acesso PRO para clientes do Pix / WhatsApp / Parcerias</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddManualSubscriber} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">E-mail do Cliente *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Nome do Cliente (Opcional)</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Período de Acesso *</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="monthly">Mensal (35 dias de carência) - R$ 29,90</option>
                    <option value="annual">Anual (375 dias de carência) - R$ 238,80</option>
                    <option value="lifetime">Vitalício (Admin / Cortesia Especial)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Canal de Pagamento</label>
                  <select
                    value={formBilling}
                    onChange={(e) => setFormBilling(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="PIX_WHATSAPP">Pix Direto (WhatsApp)</option>
                    <option value="ASAAS_MANUAL">Asaas Avulso</option>
                    <option value="CORTESIA">Cortesia / Parceiro</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>

                <div className="pt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingSub || !formEmail}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    {isSavingSub ? 'Salvando...' : 'Liberar PRO Agora'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ALTERAR SENHA MASTER */}
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div 
              className="bg-card text-foreground border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-5 h-5" />
                  <div>
                    <h3 className="font-bold text-base">Alterar Senha Master</h3>
                    <p className="text-xs text-amber-100 mt-0.5">Atualize a chave de segurança do painel administrativo</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                {pwdError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pwdError}</span>
                  </div>
                )}

                {pwdSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{pwdSuccess}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Senha Atual *</label>
                  <div className="relative">
                    <input
                      type={showCurrPwd ? 'text' : 'password'}
                      required
                      value={currPwd}
                      onChange={(e) => setCurrPwd(e.target.value)}
                      placeholder="Sua senha atual"
                      className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrPwd(!showCurrPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground p-1 transition-colors"
                    >
                      {showCurrPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Nova Senha *</label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      required
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground p-1 transition-colors"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Confirmar Nova Senha *</label>
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono tracking-widest"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingPwd || !currPwd || !newPwd}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold"
                  >
                    {isSavingPwd ? 'Salvando...' : 'Salvar Nova Senha'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
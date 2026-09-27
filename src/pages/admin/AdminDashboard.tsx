import { useEffect, useState } from 'react';
import { supabase } from '../../core/supabase/client';
import { MainLayout } from '../../ui/layout/MainLayout';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [rateVersions, setRateVersions] = useState<any[]>([]);

  async function fetchData() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    const [credsRes, ratesRes] = await Promise.all([
      supabase.rpc('get_admin_oauth_status'),
      supabase.from('marketplace_rate_versions').select('id, version, status, created_at, marketplace_rate_profiles!profile_id(marketplace)').order('created_at', { ascending: false }).limit(10)
    ]);

    if (credsRes.data) setCredentials(credsRes.data);
    if (ratesRes.data) setRateVersions(ratesRes.data);
    
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

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
      await fetchData();
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: err.message || 'Falha na sincronização' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Painel Administrativo</h1>
            <p className="text-slate-500 mt-2">Visão geral do sistema e saúde das integrações (Apenas Administradores).</p>
          </div>
          <div>
            <Button 
              onClick={handleSyncNow} 
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Taxas Agora'}
            </Button>
          </div>
        </div>

        {syncMessage && (
          <div className={`p-4 rounded-lg flex items-center gap-2 text-sm ${
            syncMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {syncMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{syncMessage.text}</span>
          </div>
        )}

        {loading ? (
          <div className="text-slate-500 animate-pulse">Carregando dados da nuvem...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Contas Conectadas
              </h2>
              {credentials.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma conta conectada.</p>
              ) : (
                <div className="space-y-4">
                  {credentials.map(c => (
                    <div key={c.marketplace + c.seller_user_id} className="p-4 border rounded-lg bg-slate-50">
                      <div className="font-semibold text-slate-800 capitalize">{c.marketplace}</div>
                      <div className="text-sm text-slate-500">Seller ID: {c.seller_user_id}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Último Refresh: {new Date(c.updated_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Histórico de Taxas Coletadas
              </h2>
              {rateVersions.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma taxa coletada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {rateVersions.map(v => (
                    <div key={v.id} className="p-3 border rounded-lg bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800 capitalize">{v.marketplace_rate_profiles?.marketplace || 'Desconhecido'}</div>
                        <div className="text-xs font-mono text-slate-400">Ver: {v.version}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(v.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          v.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
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
        )}
      </div>
    </MainLayout>
  );
}
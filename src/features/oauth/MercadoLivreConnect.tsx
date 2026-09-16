import { useState } from 'react';
import { buildAuthorizationUrl } from '../../core/oauth/pkce';
import { Button } from '../../ui/components/Button';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function MercadoLivreConnect() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');

  const handleConnect = async () => {
    try {
      setStatus('loading');
      
      const clientId = '4918110161177264';
      const redirectUri = 'https://quantovende.vercel.app/oauth/mercadolivre/callback';
      
      // Gera PKCE code_challenge e state
      const { url, verifier, state } = await buildAuthorizationUrl(clientId, redirectUri);
      
      // Armazena com segurança no sessionStorage (vínculo com o navegador atual)
      sessionStorage.setItem('ml_oauth_verifier', verifier);
      sessionStorage.setItem('ml_oauth_state', state);
      
      // Redireciona
      window.location.href = url;
    } catch (err) {
      console.error('Falha ao iniciar OAuth:', err);
      setStatus('error');
    }
  };

  return (
    <div className="p-6 border rounded-xl bg-white shadow-sm flex flex-col items-center text-center space-y-4 max-w-sm mx-auto">
      <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-2xl text-blue-900">
        ML
      </div>
      
      <div>
        <h3 className="font-semibold text-lg text-slate-800">Conectar Mercado Livre</h3>
        <p className="text-sm text-slate-500 mt-1">
          Autorize o QuantoVende a ler suas taxas e atualizar a calculadora automaticamente.
        </p>
      </div>

      {status === 'idle' && (
        <Button onClick={handleConnect} className="w-full">
          Conectar Conta
        </Button>
      )}

      {status === 'loading' && (
        <div className="flex items-center text-slate-500 space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Autorização em andamento...</span>
        </div>
      )}

      {status === 'connected' && (
        <div className="flex items-center text-green-600 space-x-2 font-medium">
          <CheckCircle2 className="w-5 h-5" />
          <span>Mercado Livre conectado</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center text-red-600 space-x-2 font-medium">
          <AlertCircle className="w-5 h-5" />
          <span>Erro ao conectar. Tente novamente.</span>
        </div>
      )}
    </div>
  );
}

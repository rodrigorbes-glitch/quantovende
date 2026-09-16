import { useEffect, useState } from 'react';
import { supabase } from '../../core/supabase/client';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function MercadoLivreCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function processCallback() {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      
      const storedState = sessionStorage.getItem('ml_oauth_state');
      const codeVerifier = sessionStorage.getItem('ml_oauth_verifier');

      // Limpa storage imediatamente para evitar replay attack no cliente
      sessionStorage.removeItem('ml_oauth_state');
      sessionStorage.removeItem('ml_oauth_verifier');

      if (error) {
        setStatus('error');
        setErrorMessage(`Autorização recusada: ${error}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Código de autorização ou state ausente.');
        return;
      }

      if (state !== storedState) {
        setStatus('error');
        setErrorMessage('Falha de segurança: state inválido (possível CSRF).');
        return;
      }

      if (!codeVerifier) {
        setStatus('error');
        setErrorMessage('Sessão expirada. Tente novamente.');
        return;
      }

      if (!supabase) {
        setStatus('error');
        setErrorMessage('Cliente do Supabase indisponível no momento.');
        return;
      }

      try {
        // Envia o code_verifier e o code para a Edge Function segura
        const response = await supabase.functions.invoke('oauth-exchange', {
          body: {
            code,
            code_verifier: codeVerifier,
            redirect_uri: 'https://quantovende.vercel.app/oauth/mercadolivre/callback'
          }
        });

        if (response.error || !response.data?.success) {
          throw new Error(response.error?.message || 'Falha na negociação com a API do Mercado Livre.');
        }

        setStatus('success');
        
        // Redireciona para o painel principal após o sucesso
        setTimeout(() => {
          window.location.href = '/?oauth=success';
        }, 3000);

      } catch (err: any) {
        console.error('Erro no callback OAuth:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Erro interno ao processar credenciais.');
      }
    }

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">
        {status === 'processing' && (
          <>
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">Conectando...</h2>
            <p className="text-slate-500">Estamos validando sua autorização com o Mercado Livre. Isso leva apenas alguns segundos.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">Conectado com Sucesso!</h2>
            <p className="text-slate-500">A conta foi autorizada. Redirecionando...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">Falha na Conexão</h2>
            <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{errorMessage}</p>
            <button 
              onClick={() => { window.location.href = '/'; }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Voltar ao Início
            </button>
          </>
        )}
      </div>
    </div>
  );
}

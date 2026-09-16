import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/crypto.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const clientId = Deno.env.get("MERCADO_LIVRE_CLIENT_ID") || "";
const clientSecret = Deno.env.get("MERCADO_LIVRE_CLIENT_SECRET") || "";
const encryptionKey = Deno.env.get("ENCRYPTION_KEY") || "";

serve(async (req) => {
  // CORS Headers (se necessário pelo frontend)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const { code, code_verifier, redirect_uri } = await req.json();

    if (!code || !code_verifier || !redirect_uri) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios ausentes" }), { status: 400 });
    }

    if (!clientId || !clientSecret || !encryptionKey) {
      return new Response(JSON.stringify({ error: "Configuração do servidor ausente" }), { status: 500 });
    }

    // 1. Troca do Authorization Code por Tokens
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri,
        code_verifier
      })
    });

    if (!response.ok) {
      // Retorna erro sanitizado
      return new Response(JSON.stringify({ error: "Falha na autorização com o Mercado Livre" }), { status: response.status });
    }

    const tokenData = await response.json();

    // 2. Obter identificador real do usuário (seller_id)
    const meResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    if (!meResponse.ok) {
      return new Response(JSON.stringify({ error: "Falha ao obter identificação do usuário Mercado Livre" }), { status: 500 });
    }

    const meData = await meResponse.json();
    const sellerUserId = String(meData.id);

    // 3. Criptografar Tokens (AES-GCM)
    const encryptedAccess = await encryptToken(tokenData.access_token, encryptionKey);
    const encryptedRefresh = await encryptToken(tokenData.refresh_token, encryptionKey);
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // 4. Salvar Tokens de forma segura no Supabase (Upsert pois é novo login)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Procura registro existente para obter versão atual
    const { data: existing } = await supabase
      .from('oauth_credentials')
      .select('id, version')
      .eq('marketplace', 'mercadolivre')
      .eq('seller_user_id', sellerUserId)
      .single();

    if (existing) {
      // OCC Update
      const { count, error: updateErr } = await supabase
        .from('oauth_credentials')
        .update({
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          expires_at: expiresAt,
          version: existing.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .eq('version', existing.version);

      if (updateErr) throw updateErr;
      if (count === 0) {
        throw new Error("Concorrência detectada ao atualizar credencial.");
      }
    } else {
      // Insert
      const { error: insertErr } = await supabase
        .from('oauth_credentials')
        .insert({
          marketplace: 'mercadolivre',
          seller_user_id: sellerUserId,
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          expires_at: expiresAt,
          version: 1
        });

      if (insertErr) throw insertErr;
    }

    // 5. Retorna sucesso sanitizado, NUNCA enviando tokens para o Frontend
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erro interno no oauth-exchange");
    return new Response(JSON.stringify({ error: "Ocorreu um erro interno." }), { status: 500 });
  }
});

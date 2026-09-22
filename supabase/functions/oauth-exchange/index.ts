import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/crypto.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const clientId = Deno.env.get("MERCADO_LIVRE_CLIENT_ID") || "";
const clientSecret = Deno.env.get("MERCADO_LIVRE_CLIENT_SECRET") || "";
const encryptionKey = Deno.env.get("ENCRYPTION_KEY") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, code_verifier, redirect_uri } = await req.json();

    if (!code || !code_verifier || !redirect_uri) {
      return new Response(JSON.stringify({ success: false, error: "Parâmetros obrigatórios ausentes" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!clientId || !clientSecret || !encryptionKey) {
      return new Response(JSON.stringify({ success: false, error: "Configuração do servidor ausente" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      const errorText = await response.text();
      console.error("ML Auth Error:", errorText);
      // Retornar 200 com payload de erro para o supabase-js não engolir a mensagem
      return new Response(JSON.stringify({ success: false, error: `ML recusou: ${errorText}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tokenData = await response.json();

    // 2. Obter identificador real do usuário (seller_id)
    const meResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    if (!meResponse.ok) {
      return new Response(JSON.stringify({ error: "Falha ao obter identificação do usuário" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const meData = await meResponse.json();
    const sellerUserId = String(meData.id);

    // 3. Criptografar Tokens (AES-GCM)
    const encryptedAccess = await encryptToken(tokenData.access_token, encryptionKey);
    const encryptedRefresh = await encryptToken(tokenData.refresh_token, encryptionKey);
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // 4. Salvar Tokens de forma segura no Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: existing } = await supabase
      .from('oauth_credentials')
      .select('id, version')
      .eq('marketplace', 'mercadolivre')
      .eq('seller_user_id', sellerUserId)
      .single();

    if (existing) {
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erro interno no oauth-exchange:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || "Ocorreu um erro interno." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

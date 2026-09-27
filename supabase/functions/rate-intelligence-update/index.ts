import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { collectMercadoLivreRates } from "./ml-collector.ts";

async function generateSha256(str: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-trigger',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const receivedToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const isAdminTrigger = req.headers.get("x-admin-trigger") === "true";
    const apiKey = req.headers.get("apikey") || "";
    
    const rawCronSecret = Deno.env.get("CRON_SECRET") || "";
    const cleanCronSecret = rawCronSecret.replace(/^"|"$/g, '').trim();

    const isCronAuthorized = cleanCronSecret.length > 0 && cleanCronSecret === receivedToken;
    const isServiceRoleAuthorized = supabaseServiceKey.length > 0 && receivedToken === supabaseServiceKey;
    const isAdminAuthorized = isAdminTrigger && apiKey.length > 0;

    if (!isCronAuthorized && !isServiceRoleAuthorized && !isAdminAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log("Autenticação passou com sucesso. Tipo:", isCronAuthorized ? "CRON" : (isServiceRoleAuthorized ? "SERVICE_ROLE" : "ADMIN_TRIGGER"));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results = [];

    // 2. Busca fontes ativas que permitem automação
    const { data: sources, error: sourceErr } = await supabase
      .from('rate_sources')
      .select('*')
      .eq('active', true)
      .eq('automation_allowed', true);

    if (sourceErr) throw sourceErr;

    // 3. Executa pipeline para o Mercado Livre
    const mlSource = sources?.find(s => s.marketplace === 'mercadolivre');
    if (mlSource) {
      const mlResult = await collectMercadoLivreRates(mlSource, supabase);
      results.push(mlResult);
    }

    // 4. Executa pipeline para a Amazon
    const amazonSource = sources?.find(s => s.marketplace === 'amazon');
    if (amazonSource) {
      const { collectAmazonRates } = await import('./amazon-collector.ts');
      const amazonResult = await collectAmazonRates(amazonSource, supabase);
      results.push(amazonResult);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

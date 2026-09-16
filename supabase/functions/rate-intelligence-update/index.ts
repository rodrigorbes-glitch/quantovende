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

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const receivedToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    
    const rawCronSecret = Deno.env.get("CRON_SECRET") || "";
    const cleanCronSecret = rawCronSecret.replace(/^"|"$/g, '').trim();

    const runtimeSecretSha256 = cleanCronSecret ? await generateSha256(cleanCronSecret) : null;
    const receivedTokenSha256 = receivedToken ? await generateSha256(receivedToken) : null;

    const tokenMatches = (cleanCronSecret === receivedToken && cleanCronSecret.length > 0);

    console.log(JSON.stringify({
      authHeaderPresent: authHeader.length > 0,
      bearerPrefixValid: /^Bearer\s+/i.test(authHeader),
      cronSecretConfigured: cleanCronSecret.length > 0,
      cronSecretLength: cleanCronSecret.length,
      receivedTokenLength: receivedToken.length,
      lengthsMatch: (cleanCronSecret.length === receivedToken.length),
      tokenMatches: tokenMatches,
      runtimeSecretSha256,
      receivedTokenSha256
    }));

    if (!tokenMatches) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    
    console.log("Autenticação passou com sucesso.");

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

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

import { encryptToken, decryptToken } from "../_shared/crypto.ts";

/**
 * Lê credencial, checa validade, rotaciona se necessário garantindo que 
 * apenas 1 worker faça o refresh no Mercado Livre por vez.
 */
export async function getValidAccessToken(supabase: any, marketplace: string): Promise<string> {
  const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
  if (!encryptionKey) throw new Error("ENCRYPTION_KEY ausente.");

  let creds = await fetchCredential(supabase, marketplace);

  if (!creds) {
    // Fallback legacy (MERCADO_LIVRE_ACCESS_TOKEN) - marcado para futura remoção
    const legacyToken = Deno.env.get(`${marketplace.toUpperCase()}_ACCESS_TOKEN`);
    if (legacyToken) {
      console.warn(`[LEGACY] Usando token manual provisório para ${marketplace}.`);
      return legacyToken;
    }
    throw new Error(`Nenhuma credencial encontrada para ${marketplace}`);
  }

  // Verifica expiração
  const expiresAt = new Date(creds.expires_at);
  const now = new Date();
  
  // Margem de segurança de 5 minutos
  const isExpired = (expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000;

  if (!isExpired) {
    return await decryptToken(creds.access_token, encryptionKey);
  }

  // Token expirado: Acionar mecanismo de Single-Flight / Distributed Lock
  return await safeRefreshWithLock(supabase, marketplace, encryptionKey);
}

/**
 * Busca credencial do banco
 */
async function fetchCredential(supabase: any, marketplace: string) {
  const { data, error } = await supabase
    .from('oauth_credentials')
    .select('*')
    .eq('marketplace', marketplace)
    .single();
  
  if (error || !data) return null;
  return data;
}

/**
 * Tenta adquirir lock, fazer refresh e salvar, ou aguarda o worker vencedor.
 */
async function safeRefreshWithLock(supabase: any, marketplace: string, encryptionKey: string): Promise<string> {
  const maxRetries = 15; // Máximo de polling aguardando outro worker (~15 seg)
  const workerUuid = crypto.randomUUID();
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;
    const creds = await fetchCredential(supabase, marketplace);
    if (!creds) throw new Error("Credencial sumiu durante o refresh.");

    // Se no meio do caminho a credencial ficou válida (outro worker já renovou)
    const expiresAt = new Date(creds.expires_at);
    if ((expiresAt.getTime() - Date.now()) >= 5 * 60 * 1000) {
      return await decryptToken(creds.access_token, encryptionKey);
    }

    // Tentar adquirir Lock exclusivo (TTL de 10s para a requisição externa)
    const lockUntil = new Date(Date.now() + 10 * 1000).toISOString();
    
    // OCC: Update lock apenas se não houver um lock válido no momento e a versão bater
    const { data, error: lockErr } = await supabase
      .from('oauth_credentials')
      .update({
        refresh_lock_until: lockUntil,
        refresh_lock_token: workerUuid,
      })
      .eq('id', creds.id)
      .eq('version', creds.version)
      .or(`refresh_lock_until.is.null,refresh_lock_until.lt.${new Date().toISOString()}`)
      .select();

    if (lockErr) throw lockErr;

    if (data && data.length === 1) {
      // 🟢 LOCK ADQUIRIDO: Somos o worker Vencedor. Vamos chamar a API externa.
      try {
        const plainRefreshToken = await decryptToken(creds.refresh_token, encryptionKey);
        
        const tokenData = await executeExternalRefresh(plainRefreshToken);
        
        const encryptedAccess = await encryptToken(tokenData.access_token, encryptionKey);
        const encryptedRefresh = await encryptToken(tokenData.refresh_token, encryptionKey);
        const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

        // Salvar e liberar Lock atomicamente
        const { data: saveData, error: saveErr } = await supabase
          .from('oauth_credentials')
          .update({
            access_token: encryptedAccess,
            refresh_token: encryptedRefresh,
            expires_at: newExpiresAt,
            refresh_lock_until: null,
            refresh_lock_token: null,
            version: creds.version + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', creds.id)
          .eq('refresh_lock_token', workerUuid) // Garante que ainda somos donos do lock
          .select();

        if (saveErr) throw saveErr;

        if (!saveData || saveData.length === 0) {
          // Extremamente improvável (Lock expirou no meio da request, outro worker assumiu)
          throw new Error("Lock perdido durante o request externo.");
        }

        return tokenData.access_token;
      } catch (err: any) {
        // Falha no request externo ou criptografia. Libera o lock prematuramente para outro tentar.
        await supabase
          .from('oauth_credentials')
          .update({ refresh_lock_until: null, refresh_lock_token: null })
          .eq('id', creds.id)
          .eq('refresh_lock_token', workerUuid);
          
        throw err;
      }
    } else {
      // 🔴 LOCK NEGADO: Outro worker está rodando. Vamos aguardar e fazer polling.
      await new Promise(res => setTimeout(res, 1000));
      continue;
    }
  }

  throw new Error("Timeout aguardando refresh token (Distributed Lock encravado).");
}

/**
 * Chamada isolada à API oficial do Mercado Livre
 */
async function executeExternalRefresh(plainRefreshToken: string) {
  const clientId = Deno.env.get("MERCADO_LIVRE_CLIENT_ID");
  const clientSecret = Deno.env.get("MERCADO_LIVRE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error('Configuração de CLIENT_ID/SECRET ausente.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout < 10s TTL

  let response;
  try {
    response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: plainRefreshToken
      }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao renovar token OAuth (Status ${response.status}): ${errorText}`);
  }

  const tokenData = await response.json();
  
  if (!tokenData.access_token || !tokenData.refresh_token) {
    throw new Error("Resposta inválida do ML: ausência de access_token ou refresh_token.");
  }

  return tokenData;
}

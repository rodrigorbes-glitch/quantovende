/**
 * Gera uma string aleatória criptograficamente segura para atuar como state ou code_verifier.
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((val) => charset[val % charset.length])
    .join('');
}

/**
 * Gera o Code Verifier (min 43, max 128 chars).
 */
export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

/**
 * Gera o State para proteção contra CSRF.
 */
export function generateState(): string {
  return generateRandomString(32);
}

/**
 * Cria o Code Challenge (S256) a partir do Code Verifier.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Base64Url encoding
  let base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Constrói a URL de autorização oficial do Mercado Livre Brasil com PKCE.
 */
export async function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string
): Promise<{ url: string; verifier: string; state: string }> {
  const verifier = generateCodeVerifier();
  const state = generateState();
  const challenge = await generateCodeChallenge(verifier);

  const url = new URL('https://auth.mercadolivre.com.br/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('scope', 'offline_access read write');

  return {
    url: url.toString(),
    verifier,
    state
  };
}

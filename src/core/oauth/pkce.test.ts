import { describe, it, expect } from 'vitest';
import { generateCodeVerifier, generateState, generateCodeChallenge, buildAuthorizationUrl } from './pkce';

describe('OAuth PKCE Utils', () => {
  it('deve gerar code_verifier valido', () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(/^[A-Za-z0-9\-._~]+$/.test(verifier)).toBe(true);
  });

  it('deve gerar state aleatorio', () => {
    const state = generateState();
    expect(state.length).toBe(32);
    const state2 = generateState();
    expect(state).not.toBe(state2); // Probabilidade infinitesimal de colisão
  });

  it('deve gerar code_challenge S256 corretamente', async () => {
    const verifier = 'a-secure-random-string-for-code-verifier-12345';
    const challenge = await generateCodeChallenge(verifier);
    
    // O desafio deve ser codificado em Base64Url
    expect(challenge).not.toContain('+');
    expect(challenge).not.toContain('/');
    expect(challenge).not.toContain('=');
    expect(challenge.length).toBeGreaterThan(0);
  });

  it('deve montar a URL de autorizacao com os parametros corretos', async () => {
    const clientId = '123456';
    const redirectUri = 'https://quantovende.vercel.app/oauth/mercadolivre/callback';
    
    const result = await buildAuthorizationUrl(clientId, redirectUri);
    
    const url = new URL(result.url);
    expect(url.hostname).toBe('auth.mercadolivre.com.br');
    expect(url.pathname).toBe('/authorization');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe(clientId);
    expect(url.searchParams.get('redirect_uri')).toBe(redirectUri);
    expect(url.searchParams.get('state')).toBe(result.state);
    expect(url.searchParams.get('code_challenge')).toBeDefined();
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });
});

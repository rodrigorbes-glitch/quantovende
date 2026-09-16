import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken } from './crypto.ts';

// Mock WebCrypto for Node/Vitest environment (if running outside browser/Deno)
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

describe('WebCrypto AES-GCM utils', () => {
  it('deve criptografar e descriptografar um texto mantendo a integridade', async () => {
    // Generate a valid base64 AES-GCM key (256 bits = 32 bytes)
    const rawKey = new Uint8Array(32);
    crypto.getRandomValues(rawKey);
    const keyBase64 = btoa(String.fromCharCode(...rawKey));
    
    const plaintext = 'mercadolivre-secret-token-12345';
    
    const encrypted = await encryptToken(plaintext, keyBase64);
    
    expect(encrypted).toContain(':'); // Formato iv:ciphertext
    expect(encrypted).not.toBe(plaintext);
    
    const decrypted = await decryptToken(encrypted, keyBase64);
    
    expect(decrypted).toBe(plaintext);
  });

  it('deve rejeitar chave invalida', async () => {
    await expect(encryptToken('test', '')).rejects.toThrow();
    await expect(decryptToken('test', '')).rejects.toThrow();
  });
  
  it('deve rejeitar formato de token invalido', async () => {
    const rawKey = new Uint8Array(32);
    crypto.getRandomValues(rawKey);
    const keyBase64 = btoa(String.fromCharCode(...rawKey));
    
    await expect(decryptToken('invalid_format_without_colon', keyBase64)).rejects.toThrow();
  });
});

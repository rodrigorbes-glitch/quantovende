// Utilitário para Criptografia de Aplicação (AES-GCM) para Proteger Tokens no Banco
// Usa a API WebCrypto disponível no Deno/Edge Functions.

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encodeBase64(bytes: Uint8Array): string {
  let binaryString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}

async function getCryptoKey(keyBase64: string): Promise<CryptoKey> {
  const rawKey = decodeBase64(keyBase64);
  if (rawKey.byteLength !== 32) {
    throw new Error(`ENCRYPTION_KEY inválida: O AES-GCM exige exatamente 32 bytes (256 bits). Recebido: ${rawKey.byteLength} bytes.`);
  }
  return await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Criptografa um texto em AES-GCM e retorna no formato: "base64(iv):base64(ciphertext)"
 */
export async function encryptToken(text: string, keyBase64: string): Promise<string> {
  if (!keyBase64 || keyBase64.length === 0) throw new Error("Chave de criptografia ausente");
  
  const key = await getCryptoKey(keyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);
  
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText
  );
  
  const cipherBytes = new Uint8Array(cipherBuffer);
  
  return `${encodeBase64(iv)}:${encodeBase64(cipherBytes)}`;
}

/**
 * Descriptografa um texto no formato "base64(iv):base64(ciphertext)"
 */
export async function decryptToken(encryptedFormat: string, keyBase64: string): Promise<string> {
  if (!keyBase64 || keyBase64.length === 0) throw new Error("Chave de criptografia ausente");
  if (!encryptedFormat.includes(':')) throw new Error("Formato de token criptografado inválido");
  
  const [ivBase64, cipherBase64] = encryptedFormat.split(':');
  
  const key = await getCryptoKey(keyBase64);
  const iv = decodeBase64(ivBase64);
  const cipherBytes = decodeBase64(cipherBase64);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBytes
  );
  
  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Mercado Livre API Adapter (Placeholder)
 * 
 * Fonte Oficial: https://api.mercadolibre.com/sites/MLB/listing_prices
 * 
 * OBSERVAÇÕES DE ARQUITETURA:
 * 1. O Mercado Livre requer parâmetros detalhados (preço, categoria, modalidade) 
 *    para retornar tarifas precisas. Não existe uma "taxa universal" única.
 * 2. O acesso não exige token autenticado de vendedor para consultas públicas, 
 *    mas a arquitetura de requisições de backend será necessária para 
 *    não expor integrações ou estourar limites de rate no client.
 * 3. Status Atual: Aguardando implementação Backend/Serverless.
 */
export async function fetchMercadoLivreRates(_params?: any): Promise<any> {
  throw new Error("Not implemented: Requires Server-Side integration.");
}

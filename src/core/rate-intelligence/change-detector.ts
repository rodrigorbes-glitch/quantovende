import type { ChangeSet } from './types';

export function detectRateChanges(oldPayload: any, newPayload: any): ChangeSet | null {
  const changes = [];

  // Exemplo conceitual de detecção de diferenças
  if (oldPayload?.baseCommission !== newPayload?.baseCommission) {
    changes.push({
      field: 'baseCommission',
      oldValue: oldPayload?.baseCommission,
      newValue: newPayload?.baseCommission
    });
  }

  if (changes.length === 0) return null;

  return {
    marketplaceId: newPayload.marketplaceId || 'unknown',
    detectedAt: new Date().toISOString(),
    changes,
    status: 'PENDING_REVIEW'
  };
}

import type { NormalizedRateProfile } from './normalizer';

export interface ChangeSet {
  marketplace: string;
  detectedAt: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
}

export function detectRateChanges(oldPayload: NormalizedRateProfile | null, newPayload: NormalizedRateProfile): ChangeSet | null {
  const changes = [];

  // Se não houver profile anterior, consideramos tudo como "novo"
  if (!oldPayload) {
    return {
      marketplace: newPayload.marketplace,
      detectedAt: new Date().toISOString(),
      changes: [{ field: 'all', oldValue: null, newValue: 'NEW_PROFILE' }],
      status: 'APPROVED' // Como é novo, pode ser aprovado imediatamente
    };
  }

  // Comparações de regras de forma bruta para o MVP
  const oldRulesStr = JSON.stringify(oldPayload.commissionRules || []);
  const newRulesStr = JSON.stringify(newPayload.commissionRules || []);
  
  if (oldRulesStr !== newRulesStr) {
    changes.push({
      field: 'commissionRules',
      oldValue: oldPayload.commissionRules,
      newValue: newPayload.commissionRules
    });
  }

  if (changes.length === 0) return null;

  return {
    marketplace: newPayload.marketplace || 'unknown',
    detectedAt: new Date().toISOString(),
    changes,
    status: 'PENDING_REVIEW'
  };
}

export type SourceType = 'OFFICIAL_API' | 'OFFICIAL_PUBLIC_PAGE' | 'OFFICIAL_DOCUMENT' | 'MANUAL_REVIEW';

export type AutomationStatus = 'ACTIVE' | 'MANUAL_REVIEW' | 'BROKEN';

export type RuleStatus = 'ACTIVE' | 'PENDING_REVIEW' | 'SUPERSEDED' | 'REJECTED';

export interface MarketplaceRateSource {
  marketplaceId: string;
  sourceUrl: string;
  sourceType: SourceType;
  official: boolean;
  automationAllowed: boolean;
  automationStatus: AutomationStatus;
  lastCheckedAt?: string;
  lastSuccessfulUpdateAt?: string;
  parserVersion: string;
  notes?: string;
}

export interface RuleVersion {
  marketplaceId: string;
  version: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  sourceUrl: string;
  retrievedAt: string;
  verifiedAt?: string;
  confidence: number;
  status: RuleStatus;
  // Payload genérico armazenando as faixas/comissões normalizadas
  ratesPayload: any;
}

export interface ChangeSet {
  marketplaceId: string;
  detectedAt: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
}

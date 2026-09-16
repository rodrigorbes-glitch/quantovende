import type { NormalizedRateProfile } from './normalizer';

export interface ValidationResult {
  isValid: boolean;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  messages: string[];
}

export function validateRatesPayload(payload: NormalizedRateProfile): ValidationResult {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, severity: 'CRITICAL', messages: ['Payload inválido ou vazio'] };
  }
  
  const messages: string[] = [];
  let isValid = true;
  let severity: ValidationResult['severity'] = 'INFO';

  // Verifica se o marketplace existe
  if (!payload.marketplace) {
    isValid = false;
    severity = 'CRITICAL';
    messages.push('Marketplace é obrigatório');
  }

  // Sanity check de comissões (não podem ser < 0 nem absurdas > 100)
  for (const rule of payload.commissionRules || []) {
    if (rule.commissionPercentage !== undefined) {
      if (rule.commissionPercentage < 0 || rule.commissionPercentage > 100) {
        isValid = false;
        severity = 'ERROR';
        messages.push(`Comissão inválida encontrada: ${rule.commissionPercentage}%`);
      }
    }
    
    if (rule.fixedFeeAmount !== undefined && rule.fixedFeeAmount < 0) {
      isValid = false;
      severity = 'ERROR';
      messages.push(`Taxa fixa negativa encontrada: ${rule.fixedFeeAmount}`);
    }
  }

  return { isValid, severity, messages };
}

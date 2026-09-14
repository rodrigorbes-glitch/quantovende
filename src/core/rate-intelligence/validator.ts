export function validateRatesPayload(payload: any): boolean {
  if (!payload || typeof payload !== 'object') return false;
  
  // Basic sanity checks to prevent a broken parser from overriding good rules.
  // Example: Commission shouldn't be negative or > 100%.
  // In a real implementation, we would validate specific tiers.
  if (payload.commission && (payload.commission < 0 || payload.commission > 100)) {
    return false;
  }
  
  return true;
}

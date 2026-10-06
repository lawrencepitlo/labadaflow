/**
 * Money utilities — all monetary values stored as integer centavos.
 * No floating-point arithmetic in money calculations.
 */

/**
 * Format centavos as Philippine Peso string: ₱1,234.56
 */
export function formatMoney(centavos: number): string {
  const pesos = centavos / 100
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos)
}

/**
 * Convert peso amount (e.g., 123.45) to centavos (12345).
 * Rounds to nearest integer to avoid floating-point issues.
 */
export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100)
}

/**
 * Convert centavos to pesos for display purposes.
 */
export function centavosToPesos(centavos: number): number {
  return centavos / 100
}

/**
 * Calculate line total in centavos: ROUND(unit_price_cents × quantity)
 * This matches the server-side calculation exactly.
 */
export function calculateLineTotal(unitPriceCents: number, quantity: number): number {
  return Math.round(unitPriceCents * quantity)
}

/**
 * Sum an array of centavo amounts.
 */
export function sumCentavos(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0)
}

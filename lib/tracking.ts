/**
 * Real-world, human-friendly tracking code generation.
 * Generates an easy-to-read, pronounceable laundry word + 4-digit number.
 * Designed for customers and staff to easily read, pronounce, and type.
 * Examples: "FRESH-4821", "CLEAN-9102", "COTTON-7381", "BUBBLE-2940"
 */
const LAUNDRY_WORDS = [
  'FRESH', 'CLEAN', 'SPIN', 'WASH', 'BUBBLE', 'COTTON', 'BREEZE', 'SHINE',
  'TIDE', 'STEAM', 'FOLD', 'CRISP', 'SOFT', 'PURE', 'SWIFT', 'SPARK',
  'MINT', 'VELVET', 'OCEAN', 'LINEN', 'BRIGHT', 'SPRING', 'BLOOM', 'CREST',
  'RIPPLE', 'GLOW', 'FLUFF', 'PEARL', 'WAVE', 'LUSH', 'FABRIC', 'CLOTH',
  'ZEN', 'BLISS', 'AURA', 'GLINT', 'VAPOR', 'FOAM', 'SILK', 'WARM',
] as const

export function generateTrackingCode(): string {
  const word = LAUNDRY_WORDS[Math.floor(Math.random() * LAUNDRY_WORDS.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${word}-${num}`
}

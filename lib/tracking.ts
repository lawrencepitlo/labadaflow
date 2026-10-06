/**
 * Tracking code generation — 16-character URL-safe alphanumeric.
 * Uses nanoid for unguessable, unique codes.
 */
import { nanoid } from 'nanoid'

/**
 * Generate a unique tracking code.
 * Format: 16 characters, URL-safe alphanumeric.
 * Example: "V1StGXR8_Z5jdHi6"
 */
export function generateTrackingCode(): string {
  return nanoid(16)
}

import { customAlphabet } from "nanoid";

// Excludes visually ambiguous characters (I, O, 0, 1) to prevent misreading
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 24);

/** Token validity in milliseconds (7 days) */
export const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function generateActivationToken(): string {
  return nanoid();
}

/** Format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX */
export function formatToken(raw: string): string {
  return raw.match(/.{1,4}/g)?.join("-") ?? raw;
}

/** Strip dashes so callers can paste formatted or raw tokens */
export function normalizeToken(input: string): string {
  return input.toUpperCase().replace(/-/g, "");
}

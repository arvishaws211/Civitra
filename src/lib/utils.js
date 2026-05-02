/**
 * Utility functions for the Civitra backend.
 */

/**
 * Strips markdown code fences from a string (e.g., ```json ... ```)
 * and trims the resulting text.
 * @param {string} text - The raw text potentially containing markdown blocks.
 * @returns {string} The cleaned text.
 */
export function cleanJsonString(text) {
  if (!text) return "";
  return text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

/**
 * Validates if a string is a valid email address.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

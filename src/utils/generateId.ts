/**
 * Generate a unique ID using timestamp and random characters.
 * This provides better collision resistance than simple Date.now().
 * Format: timestamp in base36 + random string
 */
export function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  const randomPart2 = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

/**
 * Expiration Date Helpers — Shared Between Vendor Profile Tab and Vetting Suggestions
 *
 * Per Phase 10 (D-08) and Phase 11 (D-08, D-10):
 * - Expired items: expiresAt < now
 * - Expiring-soon items: 0 < (expiresAt - now) <= 30 days
 *
 * Usage:
 * - In suggestion panel: Mark expired items with red EXPIRED chip
 * - In suggestion panel: Mark expiring-soon items with amber EXPIRING_SOON chip
 * - In vendor-profile-tab: Show expiration indicator on profile items
 * - Checklist card: Auto-dismiss when expiration date advances past today
 */

export interface ExpirationItem {
  expires_at?: string | null;
}

/**
 * Check if an item is expired (expiresAt < now)
 *
 * @param item Object with optional expires_at field (ISO 8601 string)
 * @returns true if expires_at is in the past, false otherwise (including null)
 *
 * Per D-08: Expired items shown in suggestions with warning, still attachable
 *
 * Example:
 * isExpired({ expires_at: '2026-03-01' }) → true (if today > 2026-03-01)
 * isExpired({ expires_at: null }) → false
 * isExpired({}) → false
 */
export function isExpired(item: ExpirationItem): boolean {
  if (!item.expires_at) return false;
  return new Date(item.expires_at) < new Date();
}

/**
 * Check if an item is expiring soon (0 < expiresAt - now <= 30 days)
 *
 * @param item Object with optional expires_at field (ISO 8601 string)
 * @returns true if expires_at is within next 30 days, false otherwise
 *
 * Per D-10: Expiring-soon items shown in suggestions with amber chip (no warning)
 *
 * Example:
 * isExpiringSoon({ expires_at: '2026-04-15' }) → true (if today is 2026-04-01 to 2026-04-15)
 * isExpiringSoon({ expires_at: '2026-05-01' }) → false (> 30 days away)
 * isExpiringSoon({ expires_at: '2026-03-01' }) → false (already expired)
 */
export function isExpiringSoon(item: ExpirationItem): boolean {
  if (!item.expires_at) return false;
  const now = new Date();
  const expiryDate = new Date(item.expires_at);

  // Item is in the past → already expired, not "expiring soon"
  if (expiryDate <= now) return false;

  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysUntilExpiry <= 30;
}

/**
 * Get the number of days until expiration (can be negative for expired items)
 *
 * @param item Object with optional expires_at field
 * @returns Days until expiry (negative if expired), or Infinity if no expiration date
 *
 * Useful for: sorting by urgency, calculating relative time labels
 *
 * Example:
 * getDaysUntilExpiry({ expires_at: '2026-04-15' }) → 14 (if today is 2026-04-01)
 * getDaysUntilExpiry({ expires_at: '2026-03-01' }) → -31 (if today is 2026-04-01)
 * getDaysUntilExpiry({}) → Infinity
 */
export function getDaysUntilExpiry(item: ExpirationItem): number {
  if (!item.expires_at) return Infinity;
  const now = new Date();
  const expiryDate = new Date(item.expires_at);
  return Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
}

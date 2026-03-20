/**
 * Shared email validation utility.
 *
 * Uses a robust regex that covers the vast majority of valid email addresses
 * per RFC 5321/5322 without being overly permissive. This catches common
 * injection attempts, malformed addresses, and typos.
 *
 * Rules enforced:
 *  - Local part: alphanumeric + . _ % + - (1-64 chars)
 *  - @ separator required
 *  - Domain: alphanumeric + hyphens, dot-separated labels (2+ char TLD)
 *  - Max total length: 254 characters (RFC 5321)
 *  - No consecutive dots, no leading/trailing dots in local part
 */

// Matches: user@example.com, first.last@sub.domain.co.uk, user+tag@gmail.com
// Rejects: <script>@x.com, user@.com, @domain.com, user@domain, etc.
const EMAIL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/**
 * Validate a single email address.
 * Returns true if the email is well-formed, false otherwise.
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  // Reject consecutive dots in local part
  if (trimmed.split("@")[0]?.includes("..")) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validate a comma-separated list of email addresses (for To, CC, BCC fields).
 * Returns true if ALL addresses are valid, false if any is invalid.
 * Accepts formats: "user@example.com" or "Name <user@example.com>"
 */
export function isValidEmailList(emailList: unknown): emailList is string {
  if (typeof emailList !== "string") return false;
  const trimmed = emailList.trim();
  if (trimmed.length === 0) return false;

  const addresses = trimmed.split(",").map((e) => e.trim()).filter(Boolean);
  if (addresses.length === 0) return false;

  for (const addr of addresses) {
    // Handle "Display Name <email@example.com>" format
    const bracketMatch = addr.match(/<([^>]+)>/);
    const emailPart = bracketMatch ? bracketMatch[1].trim() : addr.trim();
    if (!isValidEmail(emailPart)) return false;
  }

  return true;
}

/**
 * Extract and normalize a single email address.
 * Returns the trimmed, lowercased email or null if invalid.
 */
export function normalizeEmail(email: unknown): string | null {
  if (!isValidEmail(email)) return null;
  return (email as string).trim().toLowerCase();
}

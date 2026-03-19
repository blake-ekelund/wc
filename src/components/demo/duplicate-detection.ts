import { type Contact } from "./data";

export interface DuplicateMatch {
  contact: Contact;
  matchFields: string[]; // which fields matched
  score: number; // 0-100 confidence
}

/**
 * Check a candidate contact against existing contacts for potential duplicates.
 * Returns matches sorted by confidence score (highest first).
 */
export function findDuplicates(
  candidate: { name?: string; email?: string; phone?: string; company?: string },
  existingContacts: Contact[],
  excludeId?: string
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  const candidateEmail = (candidate.email || "").toLowerCase().trim();
  const candidatePhone = (candidate.phone || "").replace(/\D/g, "");
  const candidateName = (candidate.name || "").toLowerCase().trim();
  const candidateCompany = (candidate.company || "").toLowerCase().trim();

  for (const c of existingContacts) {
    if (excludeId && c.id === excludeId) continue;
    if (c.trashedAt) continue; // skip trashed

    let score = 0;
    const matchFields: string[] = [];

    // Exact email match — strongest signal
    const existingEmail = c.email.toLowerCase().trim();
    if (candidateEmail && existingEmail && candidateEmail === existingEmail) {
      score += 50;
      matchFields.push("email");
    }

    // Phone match (digits only, min 7 digits)
    const existingPhone = c.phone.replace(/\D/g, "");
    if (candidatePhone.length >= 7 && existingPhone.length >= 7 && candidatePhone === existingPhone) {
      score += 40;
      matchFields.push("phone");
    }

    // Name match
    const existingName = c.name.toLowerCase().trim();
    if (candidateName && existingName) {
      if (candidateName === existingName) {
        score += 30;
        matchFields.push("name (exact)");
      } else if (isFuzzyNameMatch(candidateName, existingName)) {
        score += 15;
        matchFields.push("name (similar)");
      }
    }

    // Same company + similar name is suspicious
    const existingCompany = c.company.toLowerCase().trim();
    if (candidateCompany && existingCompany && candidateCompany === existingCompany) {
      if (matchFields.some((f) => f.startsWith("name"))) {
        score += 10;
        matchFields.push("company");
      }
    }

    if (score >= 30) {
      matches.push({ contact: c, matchFields, score: Math.min(score, 100) });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Simple fuzzy name matching:
 * - Check if one name contains the other
 * - Check if first/last names match in different order
 * - Check Levenshtein distance for typos
 */
function isFuzzyNameMatch(a: string, b: string): boolean {
  // One contains the other
  if (a.includes(b) || b.includes(a)) return true;

  // Split into parts and check if they overlap
  const partsA = a.split(/\s+/);
  const partsB = b.split(/\s+/);

  // Check if all parts of the shorter name appear in the longer name
  const shorter = partsA.length <= partsB.length ? partsA : partsB;
  const longer = partsA.length > partsB.length ? partsA : partsB;
  const allPartsMatch = shorter.every((p) => longer.some((lp) => lp === p || levenshtein(p, lp) <= 1));
  if (allPartsMatch && shorter.length > 0) return true;

  // Overall Levenshtein for short names
  if (a.length < 15 && b.length < 15 && levenshtein(a, b) <= 2) return true;

  return false;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

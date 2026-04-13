import { createClient } from "@supabase/supabase-js";

export interface SearchResult {
  id: string;
  source: string;
  source_url: string | null;
  title: string;
  content: string;
  rank: number;
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Search knowledge_chunks using Postgres full-text search.
 * Returns top K results ranked by relevance.
 */
// Common stop words to exclude from ILIKE searches
const STOP_WORDS = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "shall", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "about", "like", "through", "after", "over", "between", "out", "this", "that", "these", "those", "it", "its", "how", "what", "when", "where", "why", "who", "which", "not", "no", "nor", "but", "and", "or", "if", "then", "so", "than", "too", "very", "just", "also", "my", "your", "our", "their"]);

export async function searchKnowledge(query: string, limit: number = 5): Promise<SearchResult[]> {
  const db = getDb();

  // Extract meaningful words (skip stop words, keep acronyms)
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  if (words.length === 0) {
    // If all words were stop words, just use the full query for ILIKE
    const queryWords = query.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length >= 3);
    if (queryWords.length === 0) return [];
    const { data } = await db
      .from("knowledge_chunks")
      .select("id, source, source_url, title, content")
      .or(queryWords.map((w) => `content.ilike.%${w}%`).join(","))
      .limit(limit);
    return (data || []).map((row, i) => ({ ...row, rank: 0.5 - i * 0.05 }));
  }

  // Try FTS first
  const { data, error } = await db.rpc("search_knowledge_chunks", {
    search_query: query,
    result_limit: limit,
  });

  const results: SearchResult[] = (!error && data && data.length > 0) ? data : [];

  // Always supplement with ILIKE for short queries or when FTS misses acronyms
  if (results.length < limit) {
    const existingIds = new Set(results.map((r) => r.id));
    // Build ILIKE conditions for each meaningful word
    const conditions = words.flatMap((w) => [`content.ilike.%${w}%`, `title.ilike.%${w}%`]);
    const { data: fallbackData } = await db
      .from("knowledge_chunks")
      .select("id, source, source_url, title, content")
      .or(conditions.join(","))
      .limit(limit * 2);

    // Score fallback results by how many words match
    for (const row of fallbackData || []) {
      if (existingIds.has(row.id)) continue;
      const combined = (row.title + " " + row.content).toLowerCase();
      const matchCount = words.filter((w) => combined.includes(w)).length;
      if (matchCount > 0 && results.length < limit) {
        results.push({ ...row, rank: matchCount / words.length });
        existingIds.add(row.id);
      }
    }

    // Sort by rank
    results.sort((a, b) => b.rank - a.rank);
  }

  return results.slice(0, limit);
}

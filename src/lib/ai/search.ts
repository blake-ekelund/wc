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
export async function searchKnowledge(query: string, limit: number = 5): Promise<SearchResult[]> {
  const db = getDb();

  // Convert natural language query to tsquery format
  // Split into words, filter short words, join with & (AND) operator
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return [];

  // Use plainto_tsquery for natural language and ts_rank for scoring
  const { data, error } = await db.rpc("search_knowledge_chunks", {
    search_query: query,
    result_limit: limit,
  });

  const results = (!error && data && data.length > 0) ? data : [];

  // If FTS returned too few results, supplement with ILIKE fallback
  if (results.length < 3) {
    const existingIds = new Set(results.map((r: SearchResult) => r.id));
    const { data: fallbackData } = await db
      .from("knowledge_chunks")
      .select("id, source, source_url, title, content")
      .or(words.map((w) => `content.ilike.%${w}%,title.ilike.%${w}%`).join(","))
      .limit(limit);

    for (const row of fallbackData || []) {
      if (!existingIds.has(row.id) && results.length < limit) {
        results.push({ ...row, rank: 0.1 });
      }
    }
  }

  return results;
}

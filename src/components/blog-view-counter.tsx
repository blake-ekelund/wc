"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface BlogViewCounterProps {
  slug: string;
  className?: string;
}

export default function BlogViewCounter({ slug, className = "" }: BlogViewCounterProps) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    // Increment view count
    fetch("/api/blog/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {});

    // Fetch current count
    fetch(`/api/blog/views?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => setViews(data.views || 0))
      .catch(() => setViews(0));
  }, [slug]);

  if (views === null) return null;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Eye className="w-3 h-3" />
      {views.toLocaleString()} {views === 1 ? "view" : "views"}
    </span>
  );
}

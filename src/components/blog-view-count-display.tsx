"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface BlogViewCountDisplayProps {
  slugs: string[];
}

export default function BlogViewCountDisplay({ slugs }: BlogViewCountDisplayProps) {
  const [viewMap, setViewMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/blog/views")
      .then((res) => res.json())
      .then((data) => setViewMap(data.views || {}))
      .catch(() => {});
  }, [slugs]);

  return (
    <>
      {slugs.map((slug) => (
        <span key={slug} data-slug={slug} className="hidden">
          {viewMap[slug] || 0}
        </span>
      ))}
    </>
  );
}

export function useViewCounts(slugs: string[]) {
  const [viewMap, setViewMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/blog/views")
      .then((res) => res.json())
      .then((data) => setViewMap(data.views || {}))
      .catch(() => {});
  }, [slugs]);

  return viewMap;
}

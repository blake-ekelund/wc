"use client";

import { useEffect } from "react";

export default function PageTracker() {
  useEffect(() => {
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: window.location.pathname,
          referrer: document.referrer || null,
        }),
      }).catch(() => {});
    } catch { /* non-blocking */ }
  }, []);

  return null;
}

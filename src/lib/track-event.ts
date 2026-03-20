// Client-side feature event tracking
// Fires and forgets - never blocks UI

const BATCH_INTERVAL = 5000; // flush every 5 seconds
const MAX_BATCH = 20;

interface PendingEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

let pending: PendingEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (pending.length === 0) return;
  const batch = pending.splice(0, MAX_BATCH);
  // Use sendBeacon for reliability (survives page unloads)
  const blob = new Blob([JSON.stringify({ events: batch })], { type: "application/json" });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track-events", blob);
  } else {
    fetch("/api/track-events", { method: "POST", body: blob, keepalive: true }).catch(() => {});
  }
}

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, BATCH_INTERVAL);
}

/**
 * Track a feature usage event. Fire-and-forget, batched, non-blocking.
 *
 * Usage:
 *   trackEvent("contact.created")
 *   trackEvent("calendar.viewed")
 *   trackEvent("email.sent", { templateUsed: true })
 *   trackEvent("button.clicked", { label: "Export CSV", page: "contacts" })
 */
export function trackEvent(event: string, properties?: Record<string, string | number | boolean>) {
  pending.push({ event, properties, timestamp: new Date().toISOString() });
  if (pending.length >= MAX_BATCH) {
    flush();
  } else {
    scheduleFlush();
  }
}

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flush);
  // Also flush on visibility change (tab switch/close on mobile)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

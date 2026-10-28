export type AnalyticsAction = "start" | "event" | "heartbeat" | "end";

function deviceCategory(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

function sessionId() {
  const key = "apology_visit_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export async function track(action: AnalyticsAction, eventName?: string, details?: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: action === "end",
      body: JSON.stringify({
        action,
        sessionId: sessionId(),
        device: deviceCategory(),
        path: window.location.pathname,
        eventName,
        details
      })
    });
  } catch {
    // Analytics are optional; a network failure must not interrupt the page.
  }
}

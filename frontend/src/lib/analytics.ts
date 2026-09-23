declare global {
  interface Window {
    umami?: { track: (eventName: string, eventData?: Record<string, unknown>) => void };
  }
}

export function trackEvent(name: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.umami) {
    window.umami.track(name, data);
  }
}

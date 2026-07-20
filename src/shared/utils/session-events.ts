export const SESSION_CHANGED_EVENT = "d2p:session-changed";

export function notifySessionChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

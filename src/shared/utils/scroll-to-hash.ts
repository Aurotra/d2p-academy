const CENTERED_HASH_IDS = new Set(["certificate"]);

export function scrollToHash(hash: string, behavior: ScrollBehavior = "smooth") {
  if (!hash || hash === "#") {
    return false;
  }

  const id = hash.startsWith("#") ? hash.slice(1) : hash;

  // Only in-page anchors like #hero — auth error hashes must be ignored.
  if (!/^[A-Za-z][\w-]*$/.test(id)) {
    return false;
  }

  try {
    const element = document.getElementById(id);
    if (!element) {
      return false;
    }

    element.scrollIntoView({
      behavior,
      block: CENTERED_HASH_IDS.has(id) ? "center" : "start",
    });
    return true;
  } catch {
    return false;
  }
}

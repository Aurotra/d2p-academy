export function scrollToHash(hash: string, behavior: ScrollBehavior = "smooth") {
  if (!hash || hash === "#") {
    return false;
  }

  const selector = hash.startsWith("#") ? hash : `#${hash}`;
  const element = document.querySelector(selector);
  if (!element) {
    return false;
  }

  element.scrollIntoView({ behavior, block: "start" });
  return true;
}

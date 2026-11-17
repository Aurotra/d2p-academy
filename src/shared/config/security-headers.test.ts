import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  isCardCheckoutPath,
  isTasarimAppPath,
} from "@/shared/config/security-headers";

describe("isCardCheckoutPath", () => {
  it("matches PayTR embed and result pages", () => {
    expect(isCardCheckoutPath("/odeme")).toBe(true);
    expect(isCardCheckoutPath("/odeme/9ae5f644-504c-4a6c-8a89-763155dcc462")).toBe(true);
    expect(isCardCheckoutPath("/odeme/basarili")).toBe(true);
    expect(isCardCheckoutPath("/dashboard")).toBe(false);
  });
});

describe("isTasarimAppPath", () => {
  it("matches the design tool paths", () => {
    expect(isTasarimAppPath("/tasarim")).toBe(true);
    expect(isTasarimAppPath("/tasarim/")).toBe(true);
    expect(isTasarimAppPath("/tasarim/vendor/three/three.module.js")).toBe(true);
    expect(isTasarimAppPath("/dashboard")).toBe(false);
  });
});

describe("buildContentSecurityPolicy", () => {
  it("allows any HTTPS frame on checkout so bank 3-D Secure can load", () => {
    const csp = buildContentSecurityPolicy("testnonce", {
      pathname: "/odeme/9ae5f644-504c-4a6c-8a89-763155dcc462",
    });

    expect(csp).toMatch(/frame-src 'self' https:(?:;|$)/);
    expect(csp).toMatch(/form-action 'self' https:(?:;|$)/);
  });

  it("keeps a tight frame-src off checkout", () => {
    const csp = buildContentSecurityPolicy("testnonce", { pathname: "/etkinlikler" });

    expect(csp).toContain(
      "frame-src 'self' https://www.paytr.com https://*.paytr.com https://www.google.com",
    );
    expect(csp).toContain("https://www.paytr.com https://*.paytr.com");
    expect(csp).toMatch(/form-action 'self'(?:;|$)/);
    expect(csp).not.toMatch(/frame-src 'self' https:(?:;|$)/);
    expect(csp).not.toMatch(/form-action 'self' https:(?:;|$)/);
  });

  it("relaxes script-src for D2P Tasarım static modules", () => {
    const csp = buildContentSecurityPolicy("testnonce", { pathname: "/tasarim/" });

    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'strict-dynamic'");
    expect(csp).not.toContain("nonce-testnonce");
  });
});

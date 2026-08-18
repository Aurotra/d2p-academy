import { describe, expect, it } from "vitest";

import { getClientIp } from "@/lib/utils/request-ip";

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request("https://www.d2p.com.tr/api/test", { headers });
}

describe("getClientIp", () => {
  it("reads the first x-forwarded-for hop", () => {
    const request = requestWithHeaders({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" });
    expect(getClientIp(request)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip", () => {
    const request = requestWithHeaders({ "x-real-ip": "198.51.100.4" });
    expect(getClientIp(request)).toBe("198.51.100.4");
  });

  it("falls back to cf-connecting-ip", () => {
    const request = requestWithHeaders({ "cf-connecting-ip": "192.0.2.8" });
    expect(getClientIp(request)).toBe("192.0.2.8");
  });

  it("returns null when no proxy headers exist", () => {
    const request = requestWithHeaders({});
    expect(getClientIp(request)).toBeNull();
  });

  it("prefers IPv4 when the first forwarded hop is IPv6", () => {
    const request = requestWithHeaders({
      "x-forwarded-for": "2001:db8::1, 203.0.113.20",
    });
    expect(getClientIp(request)).toBe("203.0.113.20");
  });
});

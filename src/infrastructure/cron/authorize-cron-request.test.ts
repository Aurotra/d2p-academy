import { afterEach, describe, expect, it } from "vitest";

import { authorizeCronRequest } from "@/infrastructure/cron/authorize-cron-request";

describe("authorizeCronRequest", () => {
  const original = process.env.CRON_SECRET;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = original;
    }
  });

  function requestWith(headers: Record<string, string>) {
    return new Request("https://www.d2p.com.tr/api/v1/cron/stuck-card-payments", { headers });
  }

  it("rejects when CRON_SECRET is missing or the bearer does not match", () => {
    delete process.env.CRON_SECRET;
    expect(authorizeCronRequest(requestWith({ authorization: "Bearer secret" }))).toBe(false);

    process.env.CRON_SECRET = "cron-secret";
    expect(authorizeCronRequest(requestWith({ authorization: "Bearer other" }))).toBe(false);
    expect(authorizeCronRequest(requestWith({}))).toBe(false);
  });

  it("accepts a matching bearer or x-cron-secret header", () => {
    process.env.CRON_SECRET = "cron-secret";
    expect(authorizeCronRequest(requestWith({ authorization: "Bearer cron-secret" }))).toBe(true);
    expect(authorizeCronRequest(requestWith({ "x-cron-secret": "cron-secret" }))).toBe(true);
  });
});

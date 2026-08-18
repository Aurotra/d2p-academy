import { describe, expect, it } from "vitest";

import {
  parseAdminNotificationEmails,
  shouldNotifyAdminOfEnrollment,
} from "@/infrastructure/email/admin-enrollment-notify";

describe("parseAdminNotificationEmails", () => {
  it("splits comma-separated addresses and drops junk", () => {
    expect(parseAdminNotificationEmails("Admin@D2P.com.tr, ikinci@okul.com; değil")).toEqual([
      "admin@d2p.com.tr",
      "ikinci@okul.com",
    ]);
  });

  it("returns empty when unset", () => {
    expect(parseAdminNotificationEmails(undefined)).toEqual([]);
    expect(parseAdminNotificationEmails("")).toEqual([]);
  });
});

describe("shouldNotifyAdminOfEnrollment", () => {
  it("notifies a new parent enrollment", () => {
    expect(
      shouldNotifyAdminOfEnrollment({
        alreadyEnrolled: false,
        enrollmentSource: "parent",
        status: "registered",
      }),
    ).toBe(true);
  });

  it("skips checkout holds, duplicates, paid idempotency, and admin-manual seats", () => {
    expect(
      shouldNotifyAdminOfEnrollment({
        alreadyEnrolled: true,
        enrollmentSource: "parent",
        status: "registered",
      }),
    ).toBe(false);
    expect(shouldNotifyAdminOfEnrollment({ alreadyPaid: true, enrollmentSource: "parent" })).toBe(
      false,
    );
    expect(
      shouldNotifyAdminOfEnrollment({
        enrollmentSource: "parent",
        status: "pending_payment",
      }),
    ).toBe(false);
    expect(
      shouldNotifyAdminOfEnrollment({
        enrollmentSource: "admin_manual",
        status: "registered",
      }),
    ).toBe(false);
  });
});

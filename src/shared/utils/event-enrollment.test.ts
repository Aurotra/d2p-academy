import { describe, expect, it } from "vitest";

import {
  buildAdminEventEnrollPath,
  buildEventEnrollPath,
  buildLoggedInEventEnrollPath,
} from "@/shared/utils/event-enrollment";

const eventId = "11111111-1111-1111-1111-111111111111";

describe("buildLoggedInEventEnrollPath", () => {
  it("sends admins to the admin enrollment page, not parent child-profile flow", () => {
    expect(buildLoggedInEventEnrollPath(eventId, { userRole: "admin" })).toBe(
      buildAdminEventEnrollPath(eventId),
    );
    expect(buildLoggedInEventEnrollPath(eventId, { userRole: "admin" })).not.toContain(
      "/dashboard/children",
    );
  });

  it("sends student sessions to the student dashboard", () => {
    expect(
      buildLoggedInEventEnrollPath(eventId, { sessionKind: "student", userRole: "student" }),
    ).toBe("/student-dashboard");
  });

  it("keeps parents on the children enroll flow", () => {
    expect(buildLoggedInEventEnrollPath(eventId, { userRole: "parent" })).toBe(
      buildEventEnrollPath(eventId),
    );
  });
});

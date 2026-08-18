import { describe, expect, it } from "vitest";

import {
  isInstructorAppPath,
  resolvePostLoginPath,
  sanitizeLoginRedirectPath,
} from "@/shared/utils/auth-redirect";

describe("isInstructorAppPath", () => {
  it("matches the instructor panel but not the login page", () => {
    expect(isInstructorAppPath("/instructor")).toBe(true);
    expect(isInstructorAppPath("/instructor/events/1/attendance")).toBe(true);
    expect(isInstructorAppPath("/instructor-login")).toBe(false);
    expect(isInstructorAppPath("/login")).toBe(false);
  });
});

describe("resolvePostLoginPath", () => {
  it("keeps instructors on the instructor panel", () => {
    expect(
      resolvePostLoginPath({
        requestedPath: "/instructor",
        isInstructor: true,
        portal: "parent",
      }),
    ).toBe("/instructor");
  });

  it("does not send a parent to the instructor panel", () => {
    expect(
      resolvePostLoginPath({
        requestedPath: "/instructor",
        isInstructor: false,
        defaultRedirect: "/dashboard",
        portal: "parent",
      }),
    ).toBe("/dashboard");
  });

  it("ignores leftover payment URLs on instructor login", () => {
    expect(
      resolvePostLoginPath({
        requestedPath: "/odeme/e872ac51-9a64-4443-88f3-c73979071a10?embed=1",
        isInstructor: true,
        portal: "instructor",
      }),
    ).toBe("/instructor");
  });

  it("rejects open redirects", () => {
    expect(sanitizeLoginRedirectPath("https://evil.example")).toBeNull();
    expect(sanitizeLoginRedirectPath("//evil.example")).toBeNull();
  });
});

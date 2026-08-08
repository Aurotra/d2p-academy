import { describe, expect, it } from "vitest";

import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

describe("mapAuthErrorToTurkish", () => {
  it("maps invalid credentials", () => {
    expect(mapAuthErrorToTurkish("Invalid login credentials")).toContain("E-posta veya şifre hatalı");
  });

  it("maps unconfirmed email", () => {
    expect(mapAuthErrorToTurkish("Email not confirmed")).toContain("henüz onaylanmamış");
  });

  it("maps duplicate registration", () => {
    expect(mapAuthErrorToTurkish("User already registered")).toContain("zaten bir hesap var");
  });

  it("returns a generic message when no mapping exists", () => {
    expect(mapAuthErrorToTurkish("Beklenmeyen hata")).toBe(
      "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
    );
  });
});

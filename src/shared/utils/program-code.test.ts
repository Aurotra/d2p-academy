import { describe, expect, it } from "vitest";

import { normalizeProgramCode, tryNormalizeProgramCode } from "@/shared/utils/program-code";

describe("normalizeProgramCode", () => {
  it("accepts letter-only codes", () => {
    expect(normalizeProgramCode("dc")).toBe("DC");
    expect(normalizeProgramCode("KYK")).toBe("KYK");
  });

  it("accepts alphanumeric codes like 3DTY", () => {
    expect(normalizeProgramCode("3dty")).toBe("3DTY");
    expect(tryNormalizeProgramCode("3DTY")).toBe("3DTY");
  });

  it("rejects invalid length or symbols", () => {
    expect(tryNormalizeProgramCode("A")).toBeNull();
    expect(tryNormalizeProgramCode("ABCDE")).toBeNull();
    expect(tryNormalizeProgramCode("D-C")).toBeNull();
  });
});

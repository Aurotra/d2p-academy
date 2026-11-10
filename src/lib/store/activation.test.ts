import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACTIVATION_CODE_REGEX,
  activateCode,
  curriculumProgressPercent,
  isKitActivated,
  normalizeActivationCode,
  readActivatedKits,
} from "@/lib/store/activation";
import { getStoreProductBySlug } from "@/shared/constants/store-products";

describe("store activation", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
      dispatchEvent: vi.fn(),
    });
    store.clear();
  });

  it("normalizes and validates code format", () => {
    expect(normalizeActivationCode("  d2p-radar-2026 ")).toBe("D2P-RADAR-2026");
    expect(ACTIVATION_CODE_REGEX.test("D2P-RADAR-2026")).toBe(true);
    expect(ACTIVATION_CODE_REGEX.test("ABC-123")).toBe(false);
  });

  it("activates radar kit and keeps progress on re-entry", () => {
    const first = activateCode("d2p-radar-2026");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.primarySlug).toBe("masaustu-ultrasonik-radar-kiti");
    expect(first.alreadyActivated).toBe(false);
    expect(isKitActivated("masaustu-ultrasonik-radar-kiti")).toBe(true);

    const second = activateCode("D2P-RADAR-2026");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.alreadyActivated).toBe(true);
    expect(Object.keys(readActivatedKits())).toEqual(["masaustu-ultrasonik-radar-kiti"]);
  });

  it("unlocks nested kits for full bundle code", () => {
    const result = activateCode("D2P-FULL-2026");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.primarySlug).toBe("genc-muhendis-tam-donanim-bundle");
    expect(result.unlockedSlugs).toEqual([
      "genc-muhendis-tam-donanim-bundle",
      "masaustu-ultrasonik-radar-kiti",
      "biyonik-robotik-kiskac-kiti",
    ]);
    expect(result.unlockedBundleChildren).toBe(true);
  });

  it("returns clear errors for invalid and unknown codes", () => {
    const badFormat = activateCode("NOT-A-CODE");
    expect(badFormat.ok).toBe(false);
    if (badFormat.ok) return;
    expect(badFormat.error).toMatch(/Geçersiz kod formatı/);

    const unknown = activateCode("D2P-TEST-9999");
    expect(unknown.ok).toBe(false);
    if (unknown.ok) return;
    expect(unknown.error).toMatch(/sistemde bulunamadı/);
  });

  it("computes curriculum progress", () => {
    const product = getStoreProductBySlug("masaustu-ultrasonik-radar-kiti");
    expect(product).toBeTruthy();
    if (!product) return;
    expect(curriculumProgressPercent(product, [1, 2])).toBe(50);
  });
});

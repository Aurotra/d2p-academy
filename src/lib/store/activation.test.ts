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
    expect(normalizeActivationCode("  d2p-demo-2026 ")).toBe("D2P-DEMO-2026");
    expect(ACTIVATION_CODE_REGEX.test("D2P-DEMO-2026")).toBe(true);
    expect(ACTIVATION_CODE_REGEX.test("ABC-123")).toBe(false);
  });

  it("activates demo product and keeps progress on re-entry", () => {
    const first = activateCode("d2p-demo-2026");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.primarySlug).toBe("demo-urun");
    expect(first.alreadyActivated).toBe(false);
    expect(isKitActivated("demo-urun")).toBe(true);

    const second = activateCode("D2P-DEMO-2026");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.alreadyActivated).toBe(true);
    expect(Object.keys(readActivatedKits())).toEqual(["demo-urun"]);
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
    const product = getStoreProductBySlug("demo-urun");
    expect(product).toBeTruthy();
    if (!product) return;
    expect(curriculumProgressPercent(product, [1, 2])).toBe(50);
  });
});

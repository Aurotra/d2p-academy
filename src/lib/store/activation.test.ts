import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Product } from "@/core/domain/store";
import {
  ACTIVATION_CODE_REGEX,
  activateCode,
  curriculumProgressPercent,
  normalizeActivationCode,
} from "@/lib/store/activation";

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
    const product = {
      educationIntegration: {
        curriculumPreview: [{}, {}, {}, {}],
      },
    } as Product;
    expect(curriculumProgressPercent(product, [1, 2])).toBe(50);
  });
});

import type { Product } from "@/core/domain/store";

export const ACTIVATION_CODE_REGEX = /^D2P-[A-Z0-9]{4,}-[A-Z0-9]{4,}$/;

export const ACTIVATION_STORAGE_KEY = "d2p_activated_kits";

export const ACTIVATION_UPDATED_EVENT = "d2p-activation-updated";

export interface ActivatedKitProgress {
  activatedAt: string;
  completedSteps: number[];
}

export type ActivatedKitsMap = Record<string, ActivatedKitProgress>;

/** Exact code → product slug mapping. Add entries when activatable kits ship. */
export const ACTIVATION_CODE_SLUGS: Record<string, readonly string[]> = {};

export type ActivationCode = string;

export const TEST_ACTIVATION_CODES: readonly ActivationCode[] = [];

export type ActivationResult =
  | {
      ok: true;
      code: ActivationCode;
      primarySlug: string;
      unlockedSlugs: readonly string[];
      alreadyActivated: boolean;
      unlockedBundleChildren: boolean;
    }
  | {
      ok: false;
      error: string;
    };

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isActivationCode(value: string): value is ActivationCode {
  return Object.prototype.hasOwnProperty.call(ACTIVATION_CODE_SLUGS, value);
}

export function normalizeActivationCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function readActivatedKits(): ActivatedKitsMap {
  if (!isBrowser()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(ACTIVATION_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: ActivatedKitsMap = {};
    for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        continue;
      }
      const record = value as Record<string, unknown>;
      const activatedAt = typeof record.activatedAt === "string" ? record.activatedAt : "";
      const completedSteps = Array.isArray(record.completedSteps)
        ? record.completedSteps.filter((step): step is number => typeof step === "number")
        : [];
      if (!activatedAt) {
        continue;
      }
      result[slug] = { activatedAt, completedSteps };
    }
    return result;
  } catch {
    return {};
  }
}

function writeActivatedKits(map: ActivatedKitsMap): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACTIVATION_STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(ACTIVATION_UPDATED_EVENT));
}

export function isKitActivated(slug: string, map?: ActivatedKitsMap): boolean {
  const source = map ?? readActivatedKits();
  return Boolean(source[slug]);
}

export function getCompletedSteps(slug: string, map?: ActivatedKitsMap): number[] {
  const source = map ?? readActivatedKits();
  return source[slug]?.completedSteps ?? [];
}

export function activateCode(rawCode: string): ActivationResult {
  const code = normalizeActivationCode(rawCode);

  if (!ACTIVATION_CODE_REGEX.test(code)) {
    return {
      ok: false,
      error:
        "Geçersiz kod formatı. Lütfen kutu üzerindeki kodu D2P-XXXX-XXXX formatında (yalnızca büyük harf ve rakam) giriniz.",
    };
  }

  if (!isActivationCode(code)) {
    return {
      ok: false,
      error:
        "Bu aktivasyon kodu sistemde bulunamadı. Lütfen kutu içindeki kartta yer alan kodu kontrol edin.",
    };
  }

  // TODO: [PHASE-2 SUPABASE INTEGRATION] Validate code against activation_codes table.
  const unlockedSlugs = ACTIVATION_CODE_SLUGS[code];
  const primarySlug = unlockedSlugs[0]!;
  const current = readActivatedKits();
  const alreadyActivated = Boolean(current[primarySlug]);
  const now = new Date().toISOString();

  const next: ActivatedKitsMap = { ...current };
  for (const slug of unlockedSlugs) {
    const existing = next[slug];
    next[slug] = {
      activatedAt: existing?.activatedAt ?? now,
      completedSteps: existing?.completedSteps ?? [],
    };
  }

  writeActivatedKits(next);

  // TODO: [PHASE-2 SUPABASE INTEGRATION] Upsert user_kit_progress rows for unlocked slugs.

  return {
    ok: true,
    code,
    primarySlug,
    unlockedSlugs,
    alreadyActivated,
    unlockedBundleChildren: unlockedSlugs.length > 1,
  };
}

export function toggleCurriculumStep(
  slug: string,
  step: number,
  totalSteps: number,
): ActivatedKitProgress | null {
  if (!Number.isFinite(step) || step < 1 || step > totalSteps) {
    return null;
  }

  const current = readActivatedKits();
  const existing = current[slug];
  if (!existing) {
    return null;
  }

  const completed = new Set(existing.completedSteps);
  if (completed.has(step)) {
    completed.delete(step);
  } else {
    completed.add(step);
  }

  const updated: ActivatedKitProgress = {
    activatedAt: existing.activatedAt,
    completedSteps: Array.from(completed).sort((left, right) => left - right),
  };

  writeActivatedKits({
    ...current,
    [slug]: updated,
  });

  // TODO: [PHASE-2 SUPABASE INTEGRATION] Sync completedSteps to user_kit_progress.
  return updated;
}

export function curriculumProgressPercent(product: Product, completedSteps: number[]): number {
  const total = product.educationIntegration.curriculumPreview.length;
  if (total === 0) {
    return 0;
  }
  const done = completedSteps.filter((step) => step >= 1 && step <= total).length;
  return Math.round((done / total) * 100);
}

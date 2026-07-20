"use client";

import type { MediaPermissions } from "@/core/domain/participant-forms";
import { MEDIA_PERMISSION_KEYS } from "@/core/domain/participant-forms";
import {
  EMPTY_MEDIA_PERMISSIONS,
  MEDIA_CONSENT_BLOCK_MESSAGE,
  MEDIA_CONSENT_EXPLANATION,
  MEDIA_PERMISSION_LABELS,
} from "@/shared/constants/participant-forms";

interface MediaConsentMatrixProps {
  value: MediaPermissions;
  onChange: (next: MediaPermissions) => void;
}

export function MediaConsentMatrix({ value, onChange }: MediaConsentMatrixProps) {
  const current = value ?? EMPTY_MEDIA_PERMISSIONS;
  const hasDenial = MEDIA_PERMISSION_KEYS.some((key) => current[key] === false);
  const allGranted = MEDIA_PERMISSION_KEYS.every((key) => current[key] === true);

  return (
    <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <legend className="px-1 text-sm font-semibold text-slate-900">
        Görsel / medya izinleri (F06)
      </legend>
      <p className="text-xs leading-5 text-slate-600">{MEDIA_CONSENT_EXPLANATION}</p>
      <p className="text-xs leading-5 text-slate-600">
        Her kalem için ayrı izin verin. Boş bırakılan kalem olmamalıdır.
      </p>

      {hasDenial ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          {MEDIA_CONSENT_BLOCK_MESSAGE}
        </p>
      ) : null}

      {allGranted ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Tüm görsel / medya izinleri onaylandı.
        </p>
      ) : null}

      <div className="space-y-2">
        {MEDIA_PERMISSION_KEYS.map((key) => {
          const denied = current[key] === false;
          const granted = current[key] === true;

          return (
            <div
              key={key}
              className={`flex flex-col gap-2 rounded-xl border px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
                denied
                  ? "border-red-300 bg-red-50"
                  : granted
                    ? "border-emerald-200 bg-white"
                    : "border-slate-200 bg-white"
              }`}
            >
              <p className={`text-sm ${denied ? "font-medium text-red-900" : "text-slate-800"}`}>
                {MEDIA_PERMISSION_LABELS[key]}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    granted
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                  onClick={() => onChange({ ...current, [key]: true })}
                >
                  İzin veriyorum
                </button>
                <button
                  type="button"
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    denied
                      ? "bg-red-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                  onClick={() => onChange({ ...current, [key]: false })}
                >
                  İzin vermiyorum
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

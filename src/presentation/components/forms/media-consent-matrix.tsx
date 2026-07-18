"use client";

import type { MediaPermissions } from "@/core/domain/participant-forms";
import { MEDIA_PERMISSION_KEYS } from "@/core/domain/participant-forms";
import {
  EMPTY_MEDIA_PERMISSIONS,
  MEDIA_PERMISSION_LABELS,
} from "@/shared/constants/participant-forms";

interface MediaConsentMatrixProps {
  value: MediaPermissions;
  onChange: (next: MediaPermissions) => void;
}

export function MediaConsentMatrix({ value, onChange }: MediaConsentMatrixProps) {
  const current = value ?? EMPTY_MEDIA_PERMISSIONS;

  return (
    <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <legend className="px-1 text-sm font-semibold text-slate-900">
        Görsel / medya izinleri (F06)
      </legend>
      <p className="text-xs leading-5 text-slate-600">
        Her kalem için ayrı izin verin. Boş bırakılan kalem olmamalıdır.
      </p>

      <div className="space-y-2">
        {MEDIA_PERMISSION_KEYS.map((key) => (
          <div
            key={key}
            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-slate-800">{MEDIA_PERMISSION_LABELS[key]}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  current[key] === true
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
                  current[key] === false
                    ? "bg-slate-700 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700"
                }`}
                onClick={() => onChange({ ...current, [key]: false })}
              >
                İzin vermiyorum
              </button>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

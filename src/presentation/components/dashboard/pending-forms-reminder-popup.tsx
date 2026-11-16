"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import type { PendingFormsReminderItem } from "@/shared/utils/pending-forms-reminder";

const STORAGE_KEY = "d2p_pending_forms_popup_dismissed_at";
const DISMISS_HOURS = 4;

interface PendingFormsReminderPopupProps {
  items: PendingFormsReminderItem[];
}

function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) {
      return false;
    }
    return Date.now() - dismissedAt < DISMISS_HOURS * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function PendingFormsReminderPopup({ items }: PendingFormsReminderPopupProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0 || wasDismissedRecently()) {
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(timer);
  }, [items.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function dismiss() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Ignore storage failures.
    }
    setOpen(false);
  }

  if (!open || items.length === 0) {
    return null;
  }

  const primary = items[0]!;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-navy-950/55 backdrop-blur-[2px]"
        aria-label="Pencereyi kapat"
        onClick={dismiss}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[91] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
              Form hatırlatması
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-black text-navy-950">
              Kursa kayıtlısınız — formları doldurun
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Etkinlik öncesi tanışma, onay ve gerekli test formlarının tamamlanması zorunludur.
              Eksik formlar sertifika sürecini de geciktirebilir.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={dismiss}
            className="rounded-full border border-border-surface px-3 py-1 text-sm font-semibold text-navy-900 hover:bg-surface-section"
          >
            Kapat
          </button>
        </div>

        <ul className="mt-5 space-y-3">
          {items.slice(0, 5).map((item) => (
            <li
              key={item.enrollmentId}
              className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4"
            >
              <p className="text-sm font-bold text-navy-950">{item.childName}</p>
              <p className="mt-0.5 text-sm text-muted">{item.eventTitle}</p>
              <Link
                href={item.formsHref}
                onClick={dismiss}
                className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-document-primary px-4 py-2.5 text-sm font-bold text-white"
              >
                Formları doldur
              </Link>
            </li>
          ))}
        </ul>

        {items.length > 5 ? (
          <p className="mt-3 text-xs text-muted">+{items.length - 5} kayıt daha eksik form bekliyor.</p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href={primary.formsHref}
            onClick={dismiss}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-white"
          >
            Hemen doldur
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-border-surface bg-white px-5 py-3 text-sm font-semibold text-navy-950"
          >
            Daha sonra
          </button>
        </div>
      </div>
    </div>
  );
}

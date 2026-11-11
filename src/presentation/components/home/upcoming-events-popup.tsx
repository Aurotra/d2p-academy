"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import type { EventPaymentMode, EventType } from "@/core/domain/event";
import { EVENT_TYPE_LABELS } from "@/core/domain/event";
import { EventEnrollButton } from "@/presentation/components/events/event-enroll-button";

const STORAGE_KEY = "d2p_upcoming_events_popup_dismissed_at";
const DISMISS_HOURS = 12;

export interface UpcomingEventPopupItem {
  id: string;
  title: string;
  slug: string;
  eventType: EventType;
  startAt: string;
  endAt: string;
  locationName: string | null;
  isOnline: boolean;
  isPaid: boolean;
  paymentMode: EventPaymentMode;
}

interface UpcomingEventsPopupProps {
  events: UpcomingEventPopupItem[];
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

function formatPopupDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Tarih yakında";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Istanbul",
  }).format(date);
}

export function UpcomingEventsPopup({ events }: UpcomingEventsPopupProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (events.length === 0 || wasDismissedRecently()) {
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(timer);
  }, [events.length]);

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
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
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
      // Ignore storage failures; still close the dialog.
    }
    setOpen(false);
  }

  if (!open || events.length === 0) {
    return null;
  }

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
        className="relative z-[91] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-border-surface bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              Yaklaşan etkinlikler
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-black text-navy-950">
              Kayıt için uygun atölyeler
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tarih ve yeri kontrol edin, hemen kayda başlayın.
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
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-2xl border border-border-surface bg-surface-base p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                {EVENT_TYPE_LABELS[event.eventType]}
              </p>
              <h3 className="mt-1 text-base font-bold text-navy-950">{event.title}</h3>
              <p className="mt-1 text-sm text-muted">{formatPopupDate(event.startAt)}</p>
              <p className="mt-0.5 text-sm text-subtle">
                {event.isOnline ? "Online" : event.locationName?.trim() || "Konum yakında"}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <EventEnrollButton
                  eventId={event.id}
                  paymentMode={event.paymentMode}
                  isPaid={event.isPaid}
                  compact
                />
                <Link
                  href={`/etkinlikler/${event.slug}`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border-surface bg-white px-4 py-2 text-sm font-semibold text-navy-950 transition hover:border-secondary/40"
                >
                  Detayı gör
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/etkinlikler"
            onClick={dismiss}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-document-primary px-5 py-3 text-sm font-bold text-white"
          >
            Tüm etkinlikler
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

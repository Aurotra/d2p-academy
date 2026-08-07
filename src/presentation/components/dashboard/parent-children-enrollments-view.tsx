"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { ParentChildEnrollmentItem } from "@/core/domain/parent-children-enrollments";
import { EVENT_TYPE_LABELS } from "@/core/domain/event";
import { EnrollmentFormProgress } from "@/presentation/components/dashboard/enrollment-form-progress";
import { ParentEnrollmentAttendanceProgress } from "@/presentation/components/dashboard/parent-enrollment-attendance-progress";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  eventLocationLabel,
  formatEventDateTimeRange,
} from "@/shared/utils/event-format";
import { formatPostTestDeadlineLabel } from "@/shared/utils/post-test-unlock";

const STATUS_LABELS: Record<string, string> = {
  registered: "Kayıtlı",
  attended: "Katıldı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
};

function formatRegisteredAt(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

interface ParentChildrenEnrollmentsViewProps {
  enrollments: ParentChildEnrollmentItem[];
  childrenCount: number;
}

export function ParentChildrenEnrollmentsView({
  enrollments,
  childrenCount,
}: ParentChildrenEnrollmentsViewProps) {
  const childFilters = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of enrollments) {
      map.set(item.childId, item.childName);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [enrollments]);

  const [selectedChildId, setSelectedChildId] = useState<string>("all");

  const filteredEnrollments = useMemo(() => {
    if (selectedChildId === "all") {
      return enrollments;
    }
    return enrollments.filter((item) => item.childId === selectedChildId);
  }, [enrollments, selectedChildId]);

  if (childrenCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-navy-950">Henüz çocuk hesabı yok</p>
        <p className="mt-2 text-sm text-slate-600">
          Etkinlik kayıtlarını görmek için önce çocuğunuzun öğrenci hesabını oluşturun.
        </p>
        <Link
          href="/dashboard/children?add=1"
          className="mt-4 inline-flex rounded-xl bg-document-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-document-primary-hover"
        >
          Çocuk ekle
        </Link>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-navy-950">Henüz etkinlik kaydı yok</p>
        <p className="mt-2 text-sm text-slate-600">
          Çocuklarınızı yayında olan bir etkinliğe kaydedin; kayıtlar burada listelenir.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard/children"
            className="inline-flex rounded-xl bg-document-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-document-primary-hover"
          >
            Çocuk hesapları
          </Link>
          <Link
            href="/etkinlikler"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-navy-950 transition hover:bg-slate-50"
          >
            Etkinlikleri gör
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {childFilters.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={selectedChildId === "all"}
            onClick={() => setSelectedChildId("all")}
            label="Tümü"
          />
          {childFilters.map((child) => (
            <FilterChip
              key={child.id}
              active={selectedChildId === child.id}
              onClick={() => setSelectedChildId(child.id)}
              label={child.name}
            />
          ))}
        </div>
      ) : null}

      <ul className="space-y-4">
        {filteredEnrollments.map((item) => (
          <EnrollmentCard key={item.enrollmentId} item={item} />
        ))}
      </ul>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-document-primary text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
      }`}
    >
      {label}
    </button>
  );
}

function EnrollmentCard({ item }: { item: ParentChildEnrollmentItem }) {
  const scheduleLabel = formatEventDateTimeRange(new Date(item.startAt), new Date(item.endAt));
  const locationLabel = eventLocationLabel({
    isOnline: item.isOnline,
    locationName: item.locationName,
  });
  const postTestDeadlineLabel = formatPostTestDeadlineLabel(item.postTestDeadlineAt);
  const formsHref = `/dashboard/children/${item.childId}/enrollments/${item.enrollmentId}/forms`;

  return (
    <li className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-200">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{STATUS_LABELS[item.status] ?? item.status}</Badge>
            <Badge tone="cyan">{EVENT_TYPE_LABELS[item.eventType]}</Badge>
            {item.categoryName ? (
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                style={{ backgroundColor: item.categoryColor ?? "#2563eb" }}
              >
                {item.categoryName}
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-lg font-bold text-navy-950">{item.eventTitle}</h2>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {item.childName}{" "}
            <span className="text-slate-500">@{item.childUsername}</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">{scheduleLabel}</p>
          <p className="mt-1 text-sm text-slate-500">{locationLabel}</p>
          <p className="mt-1 text-xs text-slate-400">
            Kayıt: {formatRegisteredAt(item.registeredAt)}
          </p>

          <EnrollmentFormProgress
            intakeCompleted={item.intakeCompleted}
            consentsCompleted={item.consentsCompleted}
            preTestCompleted={item.preTestCompleted}
            postTestCompleted={item.postTestCompleted}
            postTestUnlocked={item.postTestUnlocked}
            requiresPreTest={item.requiresPreTest}
            requiresSurveys={item.requiresSurveys}
          />
          <ParentEnrollmentAttendanceProgress
            presentCount={item.presentCount}
            totalLessonCount={item.totalLessonCount}
          />

          {item.requiresSurveys && item.postTestUnlocked && !item.postTestCompleted ? (
            <p className="mt-2 text-xs font-medium text-amber-800">
              Son test (F03) açık
              {postTestDeadlineLabel ? ` · Son tarih: ${postTestDeadlineLabel}` : ""}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <Link
            href={formsHref}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-document-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-document-primary-hover"
          >
            Formları doldur
          </Link>
          <Link
            href={`/etkinlikler/${item.eventSlug}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-slate-50"
          >
            Etkinlik detayı
          </Link>
          <Link href="/dashboard/children">
            <Button variant="outline" className="w-full">
              Çocuk hesapları
            </Button>
          </Link>
        </div>
      </div>
    </li>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";

import {
  EVENT_PAYMENT_MODE_LABELS,
  EVENT_STATUS_LABELS,
  type AdminEventRecord,
  type EventCategoryOption,
  type EventPaymentMode,
  type EventStatus,
  type InstructorOption,
} from "@/core/domain/admin-event";
import { EVENT_TYPE_LABELS, type EventType } from "@/core/domain/event";
import { EventCategoryPicker } from "@/presentation/components/admin/event-category-picker";
import { AdminFeedbackToast } from "@/presentation/components/admin/admin-feedback-toast";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";
import { tryNormalizeProgramCode } from "@/shared/utils/program-code";
import { computeLessonsPerDay, resolveTotalLessonCount } from "@/shared/utils/event-lesson-schedule";

interface EventsApiResponse {
  data: Array<Omit<AdminEventRecord, "startAt" | "endAt"> & { startAt: string; endAt: string }>;
}

interface CategoriesApiResponse {
  data: EventCategoryOption[];
}

type EventFormState = {
  title: string;
  description: string;
  eventType: EventType;
  categoryId: string;
  startAt: string;
  endAt: string;
  dailyLessonStart: string;
  dailyLessonEnd: string;
  lessonDurationMinutes: string;
  totalLessonCount: string;
  requiredLessonCount: string;
  locationName: string;
  isOnline: boolean;
  paymentMode: EventPaymentMode;
  /** TL as decimal string for the form, e.g. "150" or "150.50" */
  priceTry: string;
  /** Optional display-only price for external mode */
  displayPriceTry: string;
  meetingUrl: string;
  maxCapacity: string;
  programCode: string;
  status: EventStatus;
  instructorIds: string[];
};

const defaultForm: EventFormState = {
  title: "",
  description: "",
  eventType: "training",
  categoryId: "",
  startAt: "",
  endAt: "",
  dailyLessonStart: "09:00",
  dailyLessonEnd: "17:00",
  lessonDurationMinutes: "60",
  totalLessonCount: "12",
  requiredLessonCount: "8",
  locationName: "",
  isOnline: false,
  paymentMode: "free",
  priceTry: "",
  displayPriceTry: "",
  meetingUrl: "",
  maxCapacity: "",
  programCode: "",
  status: "draft",
  instructorIds: [],
};

function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function toDatetimeLocalValue(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  let hour = get("hour");
  if (hour === "24") {
    hour = "00";
  }

  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

function normalizeEventRecord(
  event: EventsApiResponse["data"][number],
): AdminEventRecord {
  return {
    ...event,
    startAt: new Date(event.startAt),
    endAt: new Date(event.endAt),
  };
}

function eventRecordToForm(event: AdminEventRecord): EventFormState {
  return {
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    categoryId: event.categoryId ?? "",
    startAt: toDatetimeLocalValue(event.startAt),
    endAt: toDatetimeLocalValue(event.endAt),
    dailyLessonStart: event.dailyLessonStart,
    dailyLessonEnd: event.dailyLessonEnd,
    lessonDurationMinutes: String(event.lessonDurationMinutes),
    totalLessonCount: event.totalLessonCount?.toString() ?? "12",
    requiredLessonCount: event.requiredLessonCount?.toString() ?? "8",
    locationName: event.locationName ?? "",
    isOnline: event.isOnline,
    paymentMode: event.paymentMode ?? (event.isPaid ? "iyzico" : "free"),
    priceTry:
      event.priceTryCents != null && event.priceTryCents > 0
        ? (event.priceTryCents / 100).toFixed(event.priceTryCents % 100 === 0 ? 0 : 2)
        : "",
    displayPriceTry:
      event.displayPriceTryCents != null && event.displayPriceTryCents > 0
        ? (event.displayPriceTryCents / 100).toFixed(
            event.displayPriceTryCents % 100 === 0 ? 0 : 2,
          )
        : "",
    meetingUrl: event.meetingUrl ?? "",
    maxCapacity: event.maxCapacity?.toString() ?? "",
    programCode: event.programCode ?? "",
    status: event.status,
    instructorIds: event.instructorIds ?? [],
  };
}

function buildEventPayload(form: EventFormState) {
  const trimmedProgramCode = form.programCode.trim();
  let programCode: string | null = null;

  if (trimmedProgramCode) {
    programCode = tryNormalizeProgramCode(trimmedProgramCode);
    if (!programCode) {
      throw new Error("Program kodu 2–4 harf olmalıdır (ör. KYK, DC).");
    }
  }

  const lessonDurationMinutes = Number(form.lessonDurationMinutes);
  if (!Number.isFinite(lessonDurationMinutes) || lessonDurationMinutes <= 0) {
    throw new Error("Ders süresi geçerli bir dakika değeri olmalıdır.");
  }

  const totalLessonCount = form.totalLessonCount.trim() ? Number(form.totalLessonCount) : null;
  if (
    totalLessonCount !== null &&
    (!Number.isFinite(totalLessonCount) || totalLessonCount <= 0)
  ) {
    throw new Error("Toplam ders sayısı pozitif bir tam sayı olmalıdır.");
  }

  const requiredLessonCount = form.requiredLessonCount.trim()
    ? Number(form.requiredLessonCount)
    : null;
  if (
    requiredLessonCount !== null &&
    (!Number.isFinite(requiredLessonCount) || requiredLessonCount <= 0)
  ) {
    throw new Error("Zorunlu katılım sayısı pozitif bir tam sayı olmalıdır.");
  }

  if (form.dailyLessonEnd <= form.dailyLessonStart) {
    throw new Error("Günlük ders bitiş saati başlangıçtan sonra olmalıdır.");
  }

  const resolvedTotalLessonCount = resolveTotalLessonCount(totalLessonCount);

  if (
    requiredLessonCount !== null &&
    requiredLessonCount > resolvedTotalLessonCount
  ) {
    throw new Error("Zorunlu katılım, toplam ders sayısından fazla olamaz.");
  }

  let priceTryCents: number | null = null;
  let displayPriceTryCents: number | null = null;

  if (form.paymentMode === "iyzico") {
    const normalized = form.priceTry.trim().replace(",", ".");
    const lira = Number(normalized);
    if (!Number.isFinite(lira) || lira <= 0) {
      throw new Error("Kartla ödeme için geçerli bir fiyat girin (ör. 150).");
    }
    priceTryCents = Math.round(lira * 100);
    if (priceTryCents <= 0) {
      throw new Error("Kartla ödeme için geçerli bir fiyat girin (ör. 150).");
    }
  } else if (form.paymentMode === "external") {
    const trimmed = form.displayPriceTry.trim();
    if (trimmed) {
      const normalized = trimmed.replace(",", ".");
      const lira = Number(normalized);
      if (!Number.isFinite(lira) || lira < 0) {
        throw new Error("Bilgi amaçlı fiyat geçersiz.");
      }
      if (lira > 0) {
        displayPriceTryCents = Math.round(lira * 100);
      }
    }
  }

  return {
    title: form.title,
    description: form.description,
    eventType: form.eventType,
    categoryId: form.categoryId || null,
    startAt: new Date(form.startAt).toISOString(),
    endAt: new Date(form.endAt).toISOString(),
    dailyLessonStart: form.dailyLessonStart,
    dailyLessonEnd: form.dailyLessonEnd,
    lessonDurationMinutes,
    totalLessonCount: resolvedTotalLessonCount,
    requiredLessonCount,
    locationName: form.locationName || null,
    isOnline: form.isOnline,
    paymentMode: form.paymentMode,
    isPaid: form.paymentMode === "iyzico",
    priceTryCents,
    displayPriceTryCents,
    meetingUrl: form.meetingUrl || null,
    maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
    programCode,
    status: form.status,
    instructorIds: form.instructorIds,
  };
}

function toggleInstructor(form: EventFormState, instructorId: string): EventFormState {
  const isSelected = form.instructorIds.includes(instructorId);
  return {
    ...form,
    instructorIds: isSelected
      ? form.instructorIds.filter((id) => id !== instructorId)
      : [...form.instructorIds, instructorId],
  };
}

function compareActiveEvents(a: AdminEventRecord, b: AdminEventRecord): number {
  const statusOrder: Record<EventStatus, number> = {
    published: 0,
    draft: 1,
    completed: 2,
    cancelled: 3,
  };
  const statusDiff = statusOrder[a.status] - statusOrder[b.status];
  if (statusDiff !== 0) {
    return statusDiff;
  }

  if (a.status === "published") {
    return a.startAt.getTime() - b.startAt.getTime();
  }

  return b.startAt.getTime() - a.startAt.getTime();
}

function compareArchivedEvents(a: AdminEventRecord, b: AdminEventRecord): number {
  const statusDiff =
    (a.status === "completed" ? 0 : 1) - (b.status === "completed" ? 0 : 1);
  if (statusDiff !== 0) {
    return statusDiff;
  }

  return b.endAt.getTime() - a.endAt.getTime();
}

function partitionAdminEvents(events: AdminEventRecord[]): {
  activeEvents: AdminEventRecord[];
  archivedEvents: AdminEventRecord[];
} {
  const activeEvents = events
    .filter((event) => event.status === "published" || event.status === "draft")
    .sort(compareActiveEvents);
  const archivedEvents = events
    .filter((event) => event.status === "completed" || event.status === "cancelled")
    .sort(compareArchivedEvents);

  return { activeEvents, archivedEvents };
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-surface bg-surface-section/50 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--text-on-surface-soft)]">{title}</h3>
        {description ? <p className="mt-1 text-xs text-subtle">{description}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function AdminActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-border-surface bg-white px-4 py-2 text-sm font-semibold text-navy-950 transition hover:border-secondary/40 hover:bg-surface-section"
    >
      {children}
    </Link>
  );
}

function EventActionBar({
  event,
  notifyingEventId,
  savingEventId,
  onEdit,
  onNotify,
  onPublishToggle,
  onDelete,
  showSave,
  onCancelEdit,
}: {
  event: AdminEventRecord;
  notifyingEventId: string | null;
  savingEventId: string | null;
  onEdit?: () => void;
  onNotify: () => void;
  onPublishToggle: () => void;
  onDelete: () => void;
  showSave?: boolean;
  onCancelEdit?: () => void;
}) {
  const isNotifying = notifyingEventId === event.id;
  const isSaving = savingEventId === event.id;

  return (
    <div className="flex flex-col gap-3 border-t border-border-surface bg-surface-section/60 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        {showSave ? (
          <>
            <Button type="submit" disabled={isSaving} className="min-h-[40px] px-4 py-2 text-sm">
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            {onCancelEdit ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancelEdit}
                className="min-h-[40px] px-4 py-2 text-sm"
              >
                İptal
              </Button>
            ) : null}
          </>
        ) : onEdit ? (
          <Button
            type="button"
            variant="primary"
            onClick={onEdit}
            className="min-h-[40px] px-4 py-2 text-sm"
          >
            Düzenle
          </Button>
        ) : null}
        <AdminActionLink href={`/admin/enrollments?event_id=${event.id}`}>Kayıtlar / Çıkar</AdminActionLink>
        <AdminActionLink href={`/admin/events/${event.id}/attendance`}>Yoklama</AdminActionLink>
        {event.instructorIds.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            disabled={isNotifying}
            onClick={onNotify}
            className="min-h-[40px] px-4 py-2 text-sm"
          >
            {isNotifying ? "Gönderiliyor..." : "Eğitmen bildirimi"}
          </Button>
        ) : null}
      </div>
      {!showSave ? (
        <div className="flex flex-wrap items-center gap-2">
          {event.status === "published" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onPublishToggle}
              className="min-h-[40px] px-4 py-2 text-sm"
            >
              Yayından kaldır
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={onPublishToggle}
              className="min-h-[40px] px-4 py-2 text-sm"
            >
              Yayınla
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={onDelete}
            className="min-h-[40px] px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            Sil
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function EventMetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 text-sm text-[var(--text-on-surface-soft)]">{value}</p>
    </div>
  );
}

function EventListCard({
  event,
  isEditing,
  editForm,
  setEditForm,
  categories,
  instructors,
  notifyingEventId,
  savingEventId,
  editCardRef,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onNotify,
  onPublishToggle,
  onDelete,
}: {
  event: AdminEventRecord;
  isEditing: boolean;
  editForm: EventFormState | null;
  setEditForm: (next: EventFormState) => void;
  categories: EventCategoryOption[];
  instructors: InstructorOption[];
  notifyingEventId: string | null;
  savingEventId: string | null;
  editCardRef?: RefObject<HTMLDivElement | null>;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (submitEvent: FormEvent<HTMLFormElement>) => void;
  onNotify: () => void;
  onPublishToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      ref={isEditing ? editCardRef : undefined}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        isEditing
          ? "border-document-primary ring-2 ring-document-primary/15"
          : "border-border-surface hover:border-border-surface"
      }`}
    >
      <div className={`px-4 py-4 sm:px-5 ${isEditing ? "bg-surface-section/50" : "bg-white"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge tone="cyan">{EVENT_TYPE_LABELS[event.eventType]}</Badge>
              <Badge tone="navy">{EVENT_STATUS_LABELS[event.status]}</Badge>
              {event.programCode ? (
                <Badge tone="cyan">Kod: {event.programCode}</Badge>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  Kod eksik
                </span>
              )}
              {event.isOnline ? (
                <Badge tone="neutral">Online</Badge>
              ) : null}
              {event.paymentMode === "iyzico" &&
              event.priceTryCents != null &&
              event.priceTryCents > 0 ? (
                <Badge tone="neutral">
                  {(event.priceTryCents / 100).toLocaleString("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                    minimumFractionDigits: event.priceTryCents % 100 === 0 ? 0 : 2,
                  })}
                </Badge>
              ) : null}
              {event.paymentMode === "external" ? (
                <Badge tone="neutral">Kurum/okul tahsilatı</Badge>
              ) : null}
            </div>
            <h3 className="mt-3 text-lg font-bold text-navy-950">{event.title}</h3>
          </div>
        </div>

        {!isEditing ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <EventMetaItem
              label="Tarih"
              value={
                <>
                  {formatDateTime(event.startAt)}
                  <span className="block text-subtle">→ {formatDateTime(event.endAt)}</span>
                </>
              }
            />
            <EventMetaItem label="Kategori" value={event.categoryName ?? "Kategorisiz"} />
            <EventMetaItem
              label="Konum"
              value={event.isOnline ? "Online etkinlik" : event.locationName ?? "Belirtilmedi"}
            />
            <EventMetaItem
              label="Eğitmen"
              value={
                event.instructorNames.length > 0
                  ? event.instructorNames.join(", ")
                  : "Atanmadı"
              }
            />
          </div>
        ) : null}
      </div>

      {isEditing && editForm ? (
        <form onSubmit={onUpdate} className="border-t border-border-surface">
          <div className="space-y-4 px-4 py-5 sm:px-5">
            <h4 className="text-base font-semibold text-navy-950">Etkinliği düzenle</h4>
            <EventFormFields
              form={editForm}
              setForm={setEditForm}
              categories={categories}
              instructors={instructors}
              idPrefix={`edit-${event.id}`}
              titleAutoFocus
            />
          </div>
          <EventActionBar
            event={event}
            notifyingEventId={notifyingEventId}
            savingEventId={savingEventId}
            onNotify={onNotify}
            onPublishToggle={onPublishToggle}
            onDelete={onDelete}
            showSave
            onCancelEdit={onCancelEdit}
          />
        </form>
      ) : (
        <EventActionBar
          event={event}
          notifyingEventId={notifyingEventId}
          savingEventId={savingEventId}
          onEdit={onStartEdit}
          onNotify={onNotify}
          onPublishToggle={onPublishToggle}
          onDelete={onDelete}
        />
      )}
    </article>
  );
}

function EventFormFields({
  form,
  setForm,
  categories,
  instructors,
  idPrefix,
  titleAutoFocus,
}: {
  form: EventFormState;
  setForm: (next: EventFormState) => void;
  categories: EventCategoryOption[];
  instructors: InstructorOption[];
  idPrefix: string;
  titleAutoFocus?: boolean;
}) {
  const lessonsPerDay = computeLessonsPerDay(
    form.dailyLessonStart,
    form.dailyLessonEnd,
    Number(form.lessonDurationMinutes) || 60,
  );

  return (
    <div className="space-y-4">
      <FormSection title="Temel bilgiler" description="Başlık, tür ve açıklama">
        <Input
          id={`${idPrefix}-title`}
          name={`${idPrefix}-title`}
          label="Başlık"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          autoFocus={titleAutoFocus}
          required
        />
        <Select
          id={`${idPrefix}-event-type`}
          name={`${idPrefix}-event-type`}
          label="Tür"
          value={form.eventType}
          onChange={(e) => setForm({ ...form, eventType: e.target.value as EventType })}
        >
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <div className="md:col-span-2">
          <Textarea
            label="Açıklama"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>
        <div className="md:col-span-2">
          <EventCategoryPicker
            idPrefix={idPrefix}
            categories={categories}
            value={form.categoryId}
            onChange={(categoryId) => setForm({ ...form, categoryId })}
          />
        </div>
      </FormSection>

      <FormSection title="Program ve yayın" description="Durum ve sertifika kodu">
        <Select
          id={`${idPrefix}-status`}
          name={`${idPrefix}-status`}
          label="Durum"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
        >
          {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <div>
          <Input
            id={`${idPrefix}-program-code`}
            name={`${idPrefix}-program-code`}
            label="Program kodu"
            value={form.programCode}
            onChange={(e) => setForm({ ...form, programCode: e.target.value.toUpperCase() })}
            placeholder="ör. KYK"
            maxLength={4}
          />
          <p className="mt-1 text-xs text-subtle" id={`${idPrefix}-program-code-hint`}>
            Öğrenci ve sertifika kodu için zorunlu (2–4 harf).
          </p>
        </div>
      </FormSection>

      <FormSection title="Tarih ve konum" description="Zaman, yer ve kontenjan">
        <Input
          id={`${idPrefix}-start-at`}
          name={`${idPrefix}-start-at`}
          label="Başlangıç"
          type="datetime-local"
          value={form.startAt}
          onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          required
        />
        <Input
          id={`${idPrefix}-end-at`}
          name={`${idPrefix}-end-at`}
          label="Bitiş"
          type="datetime-local"
          value={form.endAt}
          onChange={(e) => setForm({ ...form, endAt: e.target.value })}
          required
        />
        <Input
          id={`${idPrefix}-daily-lesson-start`}
          name={`${idPrefix}-daily-lesson-start`}
          label="Günlük ders başlangıcı"
          type="time"
          value={form.dailyLessonStart}
          onChange={(e) => setForm({ ...form, dailyLessonStart: e.target.value })}
          required
        />
        <Input
          id={`${idPrefix}-daily-lesson-end`}
          name={`${idPrefix}-daily-lesson-end`}
          label="Günlük ders bitişi"
          type="time"
          value={form.dailyLessonEnd}
          onChange={(e) => setForm({ ...form, dailyLessonEnd: e.target.value })}
          required
        />
        <Input
          id={`${idPrefix}-lesson-duration`}
          name={`${idPrefix}-lesson-duration`}
          label="Ders süresi (dakika)"
          type="number"
          min={15}
          max={480}
          step={15}
          value={form.lessonDurationMinutes}
          onChange={(e) => setForm({ ...form, lessonDurationMinutes: e.target.value })}
          required
        />
        <div>
          <Input
            id={`${idPrefix}-total-lessons`}
            name={`${idPrefix}-total-lessons`}
            label="Toplam ders sayısı (yoklama)"
            type="number"
            min={1}
            value={form.totalLessonCount}
            onChange={(e) => setForm({ ...form, totalLessonCount: e.target.value })}
            placeholder="Örn. 12"
          />
          <p className="mt-1 text-xs text-subtle">
            Kurstaki toplam yoklama dersi (ör. 12 saat = 12 ders). Etkinlik bitiş tarihiyle
            çarpılmaz. Boş bırakılırsa varsayılan 12 kullanılır
            {lessonsPerDay > 0 ? ` · Günde en fazla ${lessonsPerDay} slot` : ""}.
          </p>
        </div>
        <div>
          <Input
            id={`${idPrefix}-required-lessons`}
            name={`${idPrefix}-required-lessons`}
            label="Zorunlu katılım (sertifika / F03)"
            type="number"
            min={1}
            value={form.requiredLessonCount}
            onChange={(e) => setForm({ ...form, requiredLessonCount: e.target.value })}
            placeholder="Örn. 8"
          />
          <p className="mt-1 text-xs text-subtle">
            Öğrencinin en az bu kadar derste «geldi» işaretlenince son test açılır ve sertifika
            onay listesine düşebilir (ör. 12 dersten 8).
          </p>
        </div>
        <Input
          id={`${idPrefix}-location`}
          name={`${idPrefix}-location`}
          label="Konum"
          value={form.locationName}
          onChange={(e) => setForm({ ...form, locationName: e.target.value })}
        />
        <Input
          id={`${idPrefix}-max-capacity`}
          name={`${idPrefix}-max-capacity`}
          label="Kontenjan"
          type="number"
          min={1}
          value={form.maxCapacity}
          onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
        />
        <Input
          id={`${idPrefix}-meeting-url`}
          name={`${idPrefix}-meeting-url`}
          label="Online toplantı URL"
          value={form.meetingUrl}
          onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
        />
        <label className="flex items-center gap-2 self-end text-sm text-navy-900">
          <input
            type="checkbox"
            checked={form.isOnline}
            onChange={(e) => setForm({ ...form, isOnline: e.target.checked })}
          />
          Online etkinlik
        </label>
        <Select
          id={`${idPrefix}-payment-mode`}
          name={`${idPrefix}-payment-mode`}
          label="Ödeme tipi"
          value={form.paymentMode}
          onChange={(e) => {
            const paymentMode = e.target.value as EventPaymentMode;
            setForm({
              ...form,
              paymentMode,
              priceTry: paymentMode === "iyzico" ? form.priceTry : "",
              displayPriceTry: paymentMode === "external" ? form.displayPriceTry : "",
            });
          }}
        >
          {(Object.keys(EVENT_PAYMENT_MODE_LABELS) as EventPaymentMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {EVENT_PAYMENT_MODE_LABELS[mode]}
            </option>
          ))}
        </Select>
        {form.paymentMode === "iyzico" ? (
          <Input
            id={`${idPrefix}-price-try`}
            name={`${idPrefix}-price-try`}
            label="Ücret (TL)"
            type="number"
            min={1}
            step="0.01"
            required
            value={form.priceTry}
            onChange={(e) => setForm({ ...form, priceTry: e.target.value })}
            placeholder="150"
          />
        ) : null}
        {form.paymentMode === "external" ? (
          <div className="md:col-span-2 space-y-2">
            <p className="text-sm text-navy-800">
              Bu etkinlikte ücret kurum/okul tarafından tahsil edilir.
            </p>
            <Input
              id={`${idPrefix}-display-price-try`}
              name={`${idPrefix}-display-price-try`}
              label="Bilgi amaçlı fiyat (TL, opsiyonel)"
              type="number"
              min={0}
              step="0.01"
              value={form.displayPriceTry}
              onChange={(e) => setForm({ ...form, displayPriceTry: e.target.value })}
              placeholder="150"
            />
            <p className="text-xs text-subtle">
              Bilgi amaçlı fiyat, ödeme tetiklemez.
            </p>
          </div>
        ) : null}
      </FormSection>

      <FormSection title="Eğitmenler" description="Bir veya birden fazla eğitmen seçin">
        <div className="md:col-span-2">
          {instructors.length === 0 ? (
            <p className="text-sm text-subtle">Henüz eğitmen tanımlı değil.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {instructors.map((instructor) => {
                const inputId = `${idPrefix}-instructor-${instructor.id}`;
                const isChecked = form.instructorIds.includes(instructor.id);

                return (
                  <label
                    key={instructor.id}
                    htmlFor={inputId}
                    className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                      isChecked
                        ? "border-document-primary/40 bg-surface-section text-navy-950"
                        : "border-border-surface bg-white text-navy-900 hover:border-secondary/40"
                    }`}
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setForm(toggleInstructor(form, instructor.id))}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium">{instructor.fullName}</span>
                      <span className="block text-xs text-subtle">{instructor.email}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
}

function formatNotificationFeedback(payload: {
  notificationSummary?: string;
  notificationError?: string | null;
  instructorNotifications?: {
    sent: number;
    attempted: number;
    failed: Array<{ fullName: string; email: string; emailError: string | null }>;
  };
}): { success: string | null; warning: string | null } {
  if (payload.notificationError) {
    return {
      success: "Etkinlik kaydedildi.",
      warning: `Eğitmen bildirimi gönderilemedi: ${payload.notificationError}`,
    };
  }

  if (!payload.notificationSummary) {
    return { success: "Etkinlik kaydedildi.", warning: null };
  }

  const failedDetails = payload.instructorNotifications?.failed
    .map((item) => `${item.fullName} (${item.email}): ${item.emailError ?? "hata"}`)
    .join("\n");

  if ((payload.instructorNotifications?.failed.length ?? 0) > 0) {
    return {
      success: "Etkinlik kaydedildi.",
      warning: `${payload.notificationSummary}${failedDetails ? `\n${failedDetails}` : ""}`,
    };
  }

  return {
    success: `Etkinlik kaydedildi.\n${payload.notificationSummary}`,
    warning: null,
  };
}

export function AdminEventsManager() {
  const [events, setEvents] = useState<AdminEventRecord[]>([]);
  const [categories, setCategories] = useState<EventCategoryOption[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [createForm, setCreateForm] = useState(defaultForm);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);
  const [notifyingEventId, setNotifyingEventId] = useState<string | null>(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [createFormTouched, setCreateFormTouched] = useState(false);
  const editCardRef = useRef<HTMLDivElement | null>(null);

  const eventStats = useMemo(() => {
    const published = events.filter((event) => event.status === "published").length;
    const draft = events.filter((event) => event.status === "draft").length;
    const completed = events.filter((event) => event.status === "completed").length;
    return { total: events.length, published, draft, completed };
  }, [events]);

  const { activeEvents, archivedEvents } = useMemo(
    () => partitionAdminEvents(events),
    [events],
  );

  function renderEventCard(event: AdminEventRecord) {
    const isEditing = editingEventId === event.id && Boolean(editForm);

    return (
      <EventListCard
        key={event.id}
        event={event}
        isEditing={isEditing}
        editForm={isEditing ? editForm : null}
        setEditForm={(next) => setEditForm(next)}
        categories={categories}
        instructors={instructors}
        notifyingEventId={notifyingEventId}
        savingEventId={savingEventId}
        editCardRef={editCardRef}
        onStartEdit={() => startEditing(event)}
        onCancelEdit={cancelEditing}
        onUpdate={handleUpdate}
        onNotify={() => void notifyEventInstructors(event)}
        onPublishToggle={() =>
          void updateStatus(event.id, event.status === "published" ? "draft" : "published")
        }
        onDelete={() => void removeEvent(event.id)}
      />
    );
  }

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [eventsResponse, categoriesResponse, instructorsResponse] = await Promise.all([
        fetch("/api/v1/admin/events"),
        fetch("/api/v1/admin/event-categories"),
        fetch("/api/v1/admin/instructors"),
      ]);

      const eventsPayload = (await eventsResponse.json()) as EventsApiResponse | { error: string };
      const categoriesPayload = (await categoriesResponse.json()) as
        | CategoriesApiResponse
        | { error: string };
      const instructorsPayload = (await instructorsResponse.json()) as
        | { data: InstructorOption[] }
        | { error: string };

      if (!eventsResponse.ok || "error" in eventsPayload) {
        throw new Error("error" in eventsPayload ? eventsPayload.error : "Etkinlikler alınamadı.");
      }

      if (!categoriesResponse.ok || "error" in categoriesPayload) {
        throw new Error(
          "error" in categoriesPayload ? categoriesPayload.error : "Kategoriler alınamadı.",
        );
      }

      if (!instructorsResponse.ok || "error" in instructorsPayload) {
        throw new Error(
          "error" in instructorsPayload ? instructorsPayload.error : "Eğitmenler alınamadı.",
        );
      }

      setEvents(eventsPayload.data.map(normalizeEventRecord));
      setCategories(categoriesPayload.data);
      setInstructors(instructorsPayload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Veri yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!isLoading && !createFormTouched) {
      setCreateFormOpen(events.length === 0);
    }
  }, [createFormTouched, events.length, isLoading]);

  useEffect(() => {
    if (!editingEventId) {
      return;
    }

    editCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [editingEventId]);

  function startEditing(event: AdminEventRecord) {
    try {
      setEditingEventId(event.id);
      setEditForm(eventRecordToForm(event));
      setError(null);
    } catch (editError) {
      setError(
        editError instanceof Error
          ? editError.message
          : "Düzenleme formu açılamadı. Tarih bilgilerini kontrol edin.",
      );
    }
  }

  function cancelEditing() {
    setEditingEventId(null);
    setEditForm(null);
  }

  async function handleCreate(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const payload = buildEventPayload(createForm);
      const response = await fetch("/api/v1/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as {
        error?: string;
        notificationSummary?: string;
        notificationError?: string | null;
        instructorNotifications?: {
          sent: number;
          attempted: number;
          failed: Array<{ fullName: string; email: string; emailError: string | null }>;
        };
      };

      if (!response.ok) {
        throw new Error(responsePayload.error ?? "Etkinlik oluşturulamadı.");
      }

      setCreateForm(defaultForm);
      const feedback = formatNotificationFeedback(responsePayload);
      setSuccess(feedback.success);
      setWarning(feedback.warning);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!editingEventId || !editForm) return;

    setSavingEventId(editingEventId);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const payload = buildEventPayload(editForm);
      const response = await fetch(`/api/v1/admin/events/${editingEventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as {
        error?: string;
        notificationSummary?: string;
        notificationError?: string | null;
        instructorNotifications?: {
          sent: number;
          attempted: number;
          failed: Array<{ fullName: string; email: string; emailError: string | null }>;
        };
      };

      if (!response.ok) {
        throw new Error(responsePayload.error ?? "Etkinlik güncellenemedi.");
      }

      const feedback = formatNotificationFeedback(responsePayload);
      setSuccess(feedback.success);
      setWarning(feedback.warning);

      cancelEditing();
      await loadData();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Güncelleme başarısız.");
    } finally {
      setSavingEventId(null);
    }
  }

  async function updateStatus(id: string, status: EventStatus) {
    setError(null);

    try {
      const response = await fetch(`/api/v1/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Durum güncellenemedi.");
      }

      await loadData();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Güncelleme başarısız.");
    }
  }

  async function removeEvent(id: string) {
    if (!window.confirm("Bu etkinliği silmek istediğinize emin misiniz?")) return;

    try {
      const response = await fetch(`/api/v1/admin/events/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Silme başarısız.");
      }

      if (editingEventId === id) {
        cancelEditing();
      }

      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Silme başarısız.");
    }
  }

  async function notifyEventInstructors(event: AdminEventRecord) {
    if (event.instructorIds.length === 0) {
      setWarning("Bu etkinliğe atanmış eğitmen yok.");
      return;
    }

    setNotifyingEventId(event.id);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const response = await fetch(`/api/v1/admin/events/${event.id}/notify-instructors`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: {
          notificationSummary?: string;
          instructorNotifications?: {
            sent: number;
            attempted: number;
            failed: Array<{ fullName: string; email: string; emailError: string | null }>;
          };
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Eğitmen bildirimi gönderilemedi.");
      }

      const feedback = formatNotificationFeedback({
        notificationSummary: payload.data?.notificationSummary,
        instructorNotifications: payload.data?.instructorNotifications,
      });
      setSuccess(feedback.success?.replace("kaydedildi", "bildirimi tamamlandı") ?? "Eğitmen bildirimi gönderildi.");
      setWarning(feedback.warning);
    } catch (notifyError) {
      setError(notifyError instanceof Error ? notifyError.message : "Bildirim gönderilemedi.");
    } finally {
      setNotifyingEventId(null);
    }
  }

  function clearFeedback() {
    setError(null);
    setSuccess(null);
    setWarning(null);
  }

  return (
    <div className="space-y-6">
      <AdminFeedbackToast
        success={success}
        error={error}
        warning={warning}
        onDismiss={clearFeedback}
      />

      <div className="rounded-[2rem] border border-border-surface bg-white shadow-sm">
        <button
          type="button"
          onClick={() => {
            setCreateFormTouched(true);
            setCreateFormOpen((open) => !open);
          }}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        >
          <div>
            <h2 className="text-xl font-bold text-navy-950">Yeni Etkinlik Oluştur</h2>
            <p className="mt-1 text-sm text-subtle">
              Formu bölümlere ayırdık: temel bilgiler, program, tarih ve eğitmenler.
            </p>
          </div>
          <span className="text-sm font-semibold text-document-primary">
            {createFormOpen ? "Gizle" : "Göster"}
          </span>
        </button>

        {createFormOpen ? (
          <form onSubmit={handleCreate} className="space-y-4 border-t border-border-surface px-6 pb-6 pt-5">
            <EventFormFields
              form={createForm}
              setForm={setCreateForm}
              categories={categories}
              instructors={instructors}
              idPrefix="create"
            />
            <div className="flex justify-end border-t border-border-surface pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Kaydediliyor..." : "Etkinlik Oluştur"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-navy-950">Etkinlik Listesi</h2>
            <p className="mt-1 text-sm text-subtle">
              Aktif etkinlikler üstte; tamamlanan ve iptal edilenler altta listelenir.
            </p>
          </div>
          {!isLoading && events.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">{eventStats.total} toplam</Badge>
              <Badge tone="cyan">{eventStats.published} yayında</Badge>
              <Badge tone="navy">{eventStats.draft} taslak</Badge>
              <Badge tone="neutral">{eventStats.completed} tamamlandı</Badge>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted">Yükleniyor...</p>
        ) : events.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-border-surface bg-surface-section px-4 py-8 text-center text-sm text-muted">
            Henüz etkinlik yok. Yukarıdaki formdan ilk etkinliği oluşturabilirsiniz.
          </p>
        ) : (
          <div className="mt-6 space-y-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-navy-950">Aktif Etkinlikler</h3>
                  <p className="mt-1 text-sm text-subtle">
                    Yayında ve taslak etkinlikler; güncel işlemler için bu bölümü kullanın.
                  </p>
                </div>
                <Badge tone="cyan">{activeEvents.length} aktif</Badge>
              </div>

              {activeEvents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border-surface bg-surface-section px-4 py-8 text-center text-sm text-muted">
                  Aktif etkinlik yok. Tamamlanan etkinlikler aşağıda görünür.
                </p>
              ) : (
                <div className="space-y-4">{activeEvents.map(renderEventCard)}</div>
              )}
            </section>

            {archivedEvents.length > 0 ? (
              <section className="border-t border-border-surface pt-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-navy-950">Tamamlanan Etkinlikler</h3>
                    <p className="mt-1 text-sm text-subtle">
                      Geçmiş eğitimler ve iptal edilen etkinlikler.
                    </p>
                  </div>
                  <Badge tone="neutral">{archivedEvents.length} arşiv</Badge>
                </div>
                <div className="space-y-4">{archivedEvents.map(renderEventCard)}</div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

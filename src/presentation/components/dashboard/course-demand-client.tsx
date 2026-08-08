"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  COURSE_DEMAND_PARENT_STATUS_MESSAGES,
  COURSE_DEMAND_STATUS_LABELS,
  type CourseDemandRequest,
} from "@/core/domain/course-demand";
import type { ProgramDefinition } from "@/core/domain/program";
import { PROGRAM_CODE_OPTIONS } from "@/shared/constants/program-codes";
import {
  formatProgramDuration,
  formatProgramDurationSentence,
  suggestEndDateFromWeeks,
} from "@/shared/utils/program-duration";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";

type ChildOption = { id: string; full_name: string };

const NEW_STUDENT_VALUE = "__new__";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateRange(start: string, end: string | null): string {
  if (!end || end === start) {
    return formatDate(start);
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}

type ProgramOption = {
  code: string;
  label: string;
  program: ProgramDefinition | null;
};

export function CourseDemandClient() {
  const router = useRouter();
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [entries, setEntries] = useState<CourseDemandRequest[]>([]);
  const [programs, setPrograms] = useState<ProgramDefinition[]>([]);
  const [programCode, setProgramCode] = useState(PROGRAM_CODE_OPTIONS[0]?.code ?? "DC");
  const [studentChoice, setStudentChoice] = useState("");
  const [studentName, setStudentName] = useState("");
  const [preferredStartDate, setPreferredStartDate] = useState("");
  const [preferredEndDate, setPreferredEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const programOptions = useMemo<ProgramOption[]>(() => {
    if (programs.length > 0) {
      const knownCodes = new Set(programs.map((program) => program.programCode));
      const extras = PROGRAM_CODE_OPTIONS.filter((option) => !knownCodes.has(option.code)).map(
        (option) => ({
          code: option.code,
          label: option.label,
          program: null,
        }),
      );

      return [
        ...programs.map((program) => ({
          code: program.programCode,
          label: program.name,
          program,
        })),
        ...extras,
      ];
    }

    return PROGRAM_CODE_OPTIONS.map((option) => ({
      code: option.code,
      label: option.label,
      program: null,
    }));
  }, [programs]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.programCode === programCode) ?? null,
    [programs, programCode],
  );

  const durationInfo = selectedProgram ? formatProgramDurationSentence(selectedProgram) : null;
  const hoursOnlyInfo =
    selectedProgram &&
    selectedProgram.durationWeeks == null &&
    selectedProgram.durationHours != null
      ? `Toplam eğitim süresi: ${formatProgramDuration(selectedProgram)}. Tarih aralığını serbest seçebilirsiniz.`
      : null;

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [studentsResponse, demandsResponse, programsResponse] = await Promise.all([
        fetch("/api/v1/parent/students"),
        fetch("/api/v1/parent/course-demand"),
        fetch("/api/v1/programs"),
      ]);

      const studentsPayload = (await studentsResponse.json()) as {
        data?: { students: ChildOption[] };
      };
      const demandsPayload = (await demandsResponse.json()) as {
        data?: { entries: CourseDemandRequest[] };
        error?: string;
      };

      const programsPayload = (await programsResponse.json()) as {
        data?: { programs: ProgramDefinition[] };
      };

      if (!studentsResponse.ok) {
        throw new Error("Çocuk listesi alınamadı.");
      }
      if (!demandsResponse.ok) {
        throw new Error(demandsPayload.error ?? "Talepler alınamadı.");
      }

      const studentList = studentsPayload.data?.students ?? [];
      setChildren(studentList);
      setEntries(demandsPayload.data?.entries ?? []);
      setPrograms(programsResponse.ok ? (programsPayload.data?.programs ?? []) : []);

      if (!studentChoice && studentList.length > 0) {
        setStudentChoice(studentList[0].id);
      } else if (!studentChoice) {
        setStudentChoice(NEW_STUDENT_VALUE);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Yükleme hatası.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!preferredStartDate || selectedProgram?.durationWeeks == null) {
      return;
    }

    setPreferredEndDate(
      suggestEndDateFromWeeks(preferredStartDate, selectedProgram.durationWeeks),
    );
  }, [preferredStartDate, selectedProgram?.durationWeeks, programCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const body: Record<string, string | null> = {
      program_code: programCode,
      preferred_start_date: preferredStartDate,
      preferred_end_date: preferredEndDate || null,
      notes: notes.trim() || null,
    };

    if (studentChoice === NEW_STUDENT_VALUE) {
      body.student_name = studentName.trim();
    } else {
      body.student_profile_id = studentChoice;
    }

    try {
      const response = await fetch("/api/v1/course-demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as { error?: string };

      if (response.status === 401) {
        router.push("/login?redirectTo=/dashboard/kurs-talebi");
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Talep gönderilemedi.");
      }

      setMessage("Kurs talebiniz alındı. Yeterli talep birikince sizinle iletişime geçilecek.");
      setPreferredStartDate("");
      setPreferredEndDate("");
      setNotes("");
      setStudentName("");
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gönderim hatası.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-document-primary hover:underline">
          ← Panele dön
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-navy-950">Kurs Talep Et</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Henüz açılmış bir etkinlik yoksa, istediğiniz program ve tarih aralığı için talep
          bırakabilirsiniz. Yeterli talep birikince yeni bir sınıf açılır.
        </p>
      </div>

      <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Yeni talep</h2>
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
          <Select
            label="Program / kurs"
            value={programCode}
            onChange={(event) => setProgramCode(event.target.value)}
            required
          >
            {programOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label} ({option.code})
              </option>
            ))}
          </Select>

          {durationInfo ? (
            <p className="rounded-xl border border-border-surface bg-surface-section px-4 py-3 text-sm text-navy-900">
              {durationInfo}
            </p>
          ) : null}
          {hoursOnlyInfo ? (
            <p className="rounded-xl border border-border-surface bg-surface-section px-4 py-3 text-sm text-[var(--text-on-surface-soft)]">
              {hoursOnlyInfo}
            </p>
          ) : null}

          <Select
            label="Öğrenci"
            value={studentChoice}
            onChange={(event) => setStudentChoice(event.target.value)}
            required
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.full_name}
              </option>
            ))}
            <option value={NEW_STUDENT_VALUE}>Yeni öğrenci (ad ile)</option>
          </Select>

          {studentChoice === NEW_STUDENT_VALUE ? (
            <Input
              label="Öğrenci adı soyadı"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              required
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Uygun başlangıç tarihi"
              type="date"
              value={preferredStartDate}
              onChange={(event) => setPreferredStartDate(event.target.value)}
              required
            />
            <Input
              label="Uygun bitiş tarihi (opsiyonel)"
              type="date"
              value={preferredEndDate}
              onChange={(event) => setPreferredEndDate(event.target.value)}
              min={preferredStartDate || undefined}
            />
          </div>

          <Textarea
            label="Not (opsiyonel)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Örn. hafta içi akşamları uygunuz."
          />

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Gönderiliyor..." : "Talep Gönder"}
          </Button>
        </form>
      </div>

      <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Taleplerim</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted">Yükleniyor...</p>
        ) : entries.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Henüz kurs talebiniz yok.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-2xl border border-border-surface p-4 hover:border-amber-200 hover:bg-amber-50/30"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge tone="cyan">{entry.programCode}</Badge>
                  <Badge tone="neutral">{COURSE_DEMAND_STATUS_LABELS[entry.status]}</Badge>
                </div>
                <h3 className="mt-3 font-semibold text-navy-950">
                  {entry.studentName ?? "Öğrenci"}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Tercih edilen tarih: {formatDateRange(entry.preferredStartDate, entry.preferredEndDate)}
                </p>
                <p className="mt-2 text-sm text-subtle">
                  {COURSE_DEMAND_PARENT_STATUS_MESSAGES[entry.status]}
                </p>
                {entry.groupedEventTitle ? (
                  <p className="mt-1 text-sm text-subtle">Sınıf: {entry.groupedEventTitle}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { AdminAuditAction, AdminAuditLogRecord } from "@/core/domain/admin-audit-log";
import {
  ADMIN_AUDIT_ACTION_LABELS,
  isMemberActivityAction,
} from "@/core/domain/admin-audit-log";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";

type Filter = "all" | AdminAuditAction;

const MEMBER_ROLE_LABELS: Record<string, string> = {
  parent: "Veli",
  student: "Üye",
  admin: "Admin",
  instructor: "Eğitmen",
};

const ALL_ACTIONS = Object.keys(ADMIN_AUDIT_ACTION_LABELS) as AdminAuditAction[];

function isInstructorAction(action: AdminAuditAction): boolean {
  return action === "instructor_granted" || action === "instructor_revoked";
}

function isAdminEnrollmentAction(action: AdminAuditAction): boolean {
  return action === "enrollment_deleted" || action === "certificate_revoked";
}

function badgeTone(action: AdminAuditAction): "neutral" | "cyan" | "navy" {
  if (action === "certificate_revoked") return "neutral";
  if (action === "instructor_granted") return "navy";
  if (action === "instructor_revoked") return "cyan";
  if (isMemberActivityAction(action)) return "cyan";
  return "cyan";
}

function formatMemberRole(role: unknown): string {
  return typeof role === "string" ? (MEMBER_ROLE_LABELS[role] ?? role) : "—";
}

function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function formatActorName(log: AdminAuditLogRecord): string {
  const actorName = typeof log.metadata.actor_name === "string" ? log.metadata.actor_name : null;
  return actorName ?? log.studentName ?? (isInstructorAction(log.action) ? "Üye" : "Kullanıcı");
}

function formatPrimaryEmail(log: AdminAuditLogRecord): string | null {
  return log.actorEmail ?? log.studentEmail;
}

function formatLogSummary(log: AdminAuditLogRecord): string {
  if (isMemberActivityAction(log.action)) {
    switch (log.action) {
      case "member_registered":
        return "Yeni veli hesabı oluşturuldu.";
      case "email_confirmed":
        return "E-posta adresi onaylandı.";
      case "child_profile_created": {
        const username =
          typeof log.metadata.username === "string" ? ` (@${log.metadata.username})` : "";
        return `Çocuk hesabı eklendi${username}.`;
      }
      case "child_profile_updated": {
        const progress =
          typeof log.metadata.progress_percent === "number"
            ? ` Profil doluluk: %${log.metadata.progress_percent}.`
            : "";
        return `Çocuk profili güncellendi.${progress}`;
      }
      case "course_demand_submitted": {
        const program =
          typeof log.metadata.program_title === "string"
            ? log.metadata.program_title
            : log.metadata.program_code;
        return `Kurs talebi gönderildi${program ? ` · ${program}` : ""}.`;
      }
      case "institution_request_submitted":
        return `Kurum / okul başvuru formu gönderildi${
          log.studentName ? ` · ${log.studentName}` : ""
        }.`;
      case "enrollment_created":
        return `Etkinliğe kayıt olundu · ${log.eventTitle ?? "Etkinlik"}.`;
      case "intake_form_submitted":
        return `Tanıma formu tamamlandı · ${log.eventTitle ?? "Etkinlik"}.`;
      default:
        return "Üye hareketi kaydedildi.";
    }
  }

  if (isInstructorAction(log.action)) {
    return `Üye rolü: ${formatMemberRole(log.metadata.member_role)}`;
  }

  return `${log.eventTitle ?? "Etkinlik"}${log.certificateCode ? ` · ${log.certificateCode}` : ""}`;
}

function formatSecondaryLine(log: AdminAuditLogRecord): string | null {
  if (log.action === "child_profile_created" || log.action === "child_profile_updated") {
    if (log.studentName && formatActorName(log) !== log.studentName) {
      return `Çocuk: ${log.studentName}`;
    }
  }

  if (log.action === "course_demand_submitted" && log.studentName) {
    return `Öğrenci: ${log.studentName}`;
  }

  if (log.action === "institution_request_submitted") {
    const city = typeof log.metadata.city === "string" ? log.metadata.city : null;
    const contact = formatPrimaryEmail(log);
    const parts = [contact, city].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  }

  if (log.action === "member_registered" && log.metadata.resent_confirmation === true) {
    return "Mevcut hesap için onay maili yeniden gönderildi.";
  }

  return null;
}

export function AdminAuditLogsView() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("action");
  const [filter, setFilter] = useState<Filter>(
    ALL_ACTIONS.includes(initial as AdminAuditAction) ? (initial as Filter) : "all",
  );
  const [logs, setLogs] = useState<AdminAuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(nextFilter: Filter = filter) {
    setIsLoading(true);
    setError(null);

    try {
      const query = nextFilter === "all" ? "" : `?action=${nextFilter}`;
      const response = await fetch(`/api/v1/admin/audit-logs${query}`);
      const payload = (await response.json()) as
        | { data: Array<Omit<AdminAuditLogRecord, "createdAt"> & { createdAt: string }> }
        | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Loglar alınamadı.");
      }

      setLogs(
        payload.data.map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt),
        })),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Yükleme hatası.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filters = useMemo(
    () =>
      [
        { id: "all" as const, label: "Tümü" },
        { id: "member_registered" as const, label: "Veli kaydı" },
        { id: "email_confirmed" as const, label: "E-posta onayı" },
        { id: "child_profile_created" as const, label: "Çocuk eklendi" },
        { id: "child_profile_updated" as const, label: "Profil güncellendi" },
        { id: "course_demand_submitted" as const, label: "Kurs talebi" },
        { id: "institution_request_submitted" as const, label: "Kurum formu" },
        { id: "enrollment_created" as const, label: "Etkinlik kaydı" },
        { id: "intake_form_submitted" as const, label: "Tanıma formu" },
        { id: "certificate_revoked" as const, label: "Sertifika iptalleri" },
        { id: "enrollment_deleted" as const, label: "Kayıt silmeleri" },
        { id: "instructor_granted" as const, label: "Eğitmen verildi" },
        { id: "instructor_revoked" as const, label: "Eğitmen yetkisi alındı" },
      ] as const,
    [],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-navy-950">İşlem Logları</h1>
        <p className="mt-2 text-sm text-slate-600">
          Üye hareketleri (kayıt, profil, form, etkinlik) ve admin işlemleri (sertifika, kayıt silme,
          eğitmen yetkisi) burada listelenir.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                filter === item.id
                  ? "bg-document-primary text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
          <Button
            type="button"
            variant="secondary"
            className="min-h-[40px] px-3 py-2 text-xs"
            onClick={() => void load()}
          >
            Yenile
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-slate-600">Yükleniyor...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-600">Henüz kayıt yok.</p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => {
              const email = formatPrimaryEmail(log);
              const secondary = formatSecondaryLine(log);

              return (
                <li
                  key={log.id}
                  className="rounded-2xl border border-slate-100 px-4 py-4 hover:border-sky-200"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={badgeTone(log.action)}>
                      {ADMIN_AUDIT_ACTION_LABELS[log.action]}
                    </Badge>
                    <span className="text-xs text-slate-500">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="mt-2 font-semibold text-navy-950">
                    {formatActorName(log)}
                    {email ? ` · ${email}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{formatLogSummary(log)}</p>
                  {secondary ? <p className="mt-1 text-sm text-slate-500">{secondary}</p> : null}
                  {log.reason ? (
                    <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800">
                      <span className="font-semibold">Neden: </span>
                      {log.reason}
                    </p>
                  ) : null}
                  {log.actorEmail && isAdminEnrollmentAction(log.action) ? (
                    <p className="mt-2 text-xs text-slate-500">İşlemi yapan: {log.actorEmail}</p>
                  ) : null}
                  {log.actorEmail && isInstructorAction(log.action) ? (
                    <p className="mt-2 text-xs text-slate-500">İşlemi yapan: {log.actorEmail}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

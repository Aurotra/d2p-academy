"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { formatTryCentsDisplay } from "@/core/domain/payment";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import type { AdminReportPeriodPreset } from "@/infrastructure/reports/admin-report-period";
import {
  REPORT_ENROLLMENT_SOURCE_LABELS,
  type AdminReportOverview,
  type AdminReportSourceTrend,
  type ReportEnrollmentSource,
} from "@/infrastructure/reports/build-admin-reports";

const SOURCE_COLORS: Record<ReportEnrollmentSource, string> = {
  parent: "bg-document-primary",
  admin_manual: "bg-secondary",
  self: "bg-cyan-600",
  unknown_legacy: "bg-slate-400",
};

const SOURCE_ORDER: ReportEnrollmentSource[] = [
  "parent",
  "admin_manual",
  "self",
  "unknown_legacy",
];

export type AdminReportsTab = "overview" | "source";

interface AdminReportsClientProps {
  tab: AdminReportsTab;
  preset: AdminReportPeriodPreset;
  from: string;
  to: string;
  rangeLabel: string;
  overview: Omit<AdminReportOverview, "range">;
  sourceTrend: AdminReportSourceTrend;
  periodError?: string | null;
}

function MetricCard({
  title,
  value,
  hint,
  footer,
}: {
  title: string;
  value: string;
  hint?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-surface bg-surface-section/60 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{title}</p>
      <p className="mt-1 text-2xl font-bold text-navy-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      {footer}
    </div>
  );
}

function formatTrend(pct: number | null, previousCents: number, currentCents: number): string {
  if (previousCents <= 0 && currentCents > 0) {
    return "Önceki dönemde tahsilat yok";
  }
  if (pct == null) {
    return "Karşılaştırma yok";
  }
  if (pct === 0) {
    return "Önceki döneme göre değişmedi";
  }
  const arrow = pct > 0 ? "▲" : "▼";
  return `${arrow} önceki döneme göre %${Math.abs(pct).toLocaleString("tr-TR")}`;
}

export function AdminReportsClient({
  tab,
  preset,
  from,
  to,
  rangeLabel,
  overview,
  sourceTrend,
  periodError,
}: AdminReportsClientProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<AdminReportPeriodPreset>(preset);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  function hrefFor(nextTab: AdminReportsTab, nextPreset = period): string {
    const params = new URLSearchParams();
    params.set("tab", nextTab);
    params.set("period", nextPreset);
    if (nextPreset === "custom") {
      if (customFrom) params.set("from", customFrom);
      if (customTo) params.set("to", customTo);
    }
    return `/admin/reports?${params.toString()}`;
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    router.push(hrefFor(tab, period));
  }

  const maxBucket = Math.max(1, ...sourceTrend.buckets.map((bucket) => bucket.total));

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border-surface bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Finans
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy-950">Raporlar</h1>
        <p className="mt-2 text-sm text-muted">
          Dönem: {rangeLabel} (Europe/Istanbul). Platform tahsilatı ile kurum/okul tahmini
          toplanmaz.
        </p>

        <form onSubmit={applyFilters} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            id="report-period"
            label="Dönem"
            value={period}
            onChange={(event) => setPeriod(event.target.value as AdminReportPeriodPreset)}
          >
            <option value="this_month">Bu ay</option>
            <option value="last_3_months">Son 3 ay</option>
            <option value="last_12_months">Son 12 ay</option>
            <option value="custom">Özel aralık</option>
          </Select>
          {period === "custom" ? (
            <>
              <Input
                id="report-from"
                label="Başlangıç"
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                required
              />
              <Input
                id="report-to"
                label="Bitiş"
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                required
              />
            </>
          ) : null}
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Uygula
            </Button>
          </div>
        </form>
        {periodError ? <p className="mt-3 text-sm text-red-600">{periodError}</p> : null}
      </div>

      <div className="flex gap-2">
        <Link
          href={hrefFor("overview")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "overview"
              ? "bg-navy-950 text-white"
              : "border border-border-surface bg-white text-navy-900 hover:border-secondary/40"
          }`}
        >
          Genel Bakış
        </Link>
        <Link
          href={hrefFor("source")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "source"
              ? "bg-navy-950 text-white"
              : "border border-border-surface bg-white text-navy-900 hover:border-secondary/40"
          }`}
        >
          Kayıt Kaynağı Trendi
        </Link>
      </div>

      {tab === "overview" ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Toplam tahsilat (kart)"
              value={formatTryCentsDisplay(overview.iyzicoCollectedTryCents)}
              hint={formatTrend(
                overview.iyzicoTrendPct,
                overview.previousIyzicoCollectedTryCents,
                overview.iyzicoCollectedTryCents,
              )}
            />
            <MetricCard
              title="Kurum/okul tahmini"
              value={formatTryCentsDisplay(overview.externalEstimateTryCents)}
              hint="display_price × onaylı koltuk; ödeme tetiklemez, kart tahsilatına eklenmez"
            />
            <MetricCard
              title="İptal oranı"
              value={
                overview.cancelRatePct == null ? "—" : `%${overview.cancelRatePct.toLocaleString("tr-TR")}`
              }
              hint={`${overview.cancelledCount} iptal / ${overview.enrollmentCount} kayıt (soft-cancel)`}
            />
            <div className="rounded-2xl border border-border-surface bg-surface-section/60 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                Açık bekleyen iade
              </p>
              <p className="mt-1 text-2xl font-bold text-navy-950">
                {overview.openRefundFollowupCount}
              </p>
              <Link
                href="/admin/refund-followups"
                className="mt-1 inline-block text-xs font-semibold text-document-primary hover:underline"
              >
                Bekleyen İadeler →
              </Link>
            </div>
          </div>

          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Not: bu dönemde {overview.hardDeletedCount} kayıt tamamen silindi; iptal oranına dahil
            değil. 080 öncesi silmeler işlem logunda eksik olabilir.
          </p>

          <div className="rounded-[1.75rem] border border-border-surface bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy-950">En çok tercih edilen etkinlikler</h2>
            <p className="mt-1 text-sm text-muted">
              Onaylı koltuk (registered / attended / completed), dönem içi kayıtlar
            </p>
            {overview.popularEvents.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Bu dönemde onaylı kayıt yok.</p>
            ) : (
              <ol className="mt-4 space-y-2">
                {overview.popularEvents.map((event, index) => (
                  <li
                    key={event.eventId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-surface px-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="mr-2 text-xs font-bold text-subtle">{index + 1}.</span>
                      <span className="font-semibold text-navy-950">{event.title}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-navy-900">
                      {event.confirmedSeatCount} kayıt
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <p className="rounded-2xl border border-border-surface bg-white px-4 py-3 text-sm text-navy-900 shadow-sm">
            Bu dönemde{" "}
            <strong>{sourceTrend.totals.parent}</strong> veli,{" "}
            <strong>{sourceTrend.totals.admin_manual}</strong> admin,{" "}
            <strong>{sourceTrend.totals.self}</strong> öğrenci
            {sourceTrend.totals.unknown_legacy > 0
              ? `, ${sourceTrend.totals.unknown_legacy} diğer (eski)`
              : ""}{" "}
            kayıt ({sourceTrend.totals.total} toplam).
          </p>

          <div className="rounded-[1.75rem] border border-border-surface bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy-950">
              {sourceTrend.bucketKind === "week" ? "Haftalık" : "Aylık"} kaynak dağılımı
            </h2>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
              {SOURCE_ORDER.map((source) => (
                <span key={source} className="inline-flex items-center gap-1.5">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${SOURCE_COLORS[source]}`} />
                  {REPORT_ENROLLMENT_SOURCE_LABELS[source]}
                </span>
              ))}
            </div>

            {sourceTrend.buckets.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Bu dönemde kayıt yok.</p>
            ) : (
              <div className="mt-6 flex items-end gap-2 overflow-x-auto pb-2">
                {sourceTrend.buckets.map((bucket) => (
                  <div key={bucket.key} className="flex min-w-12 flex-1 flex-col items-center gap-2">
                    <div
                      className="flex h-40 w-full max-w-16 flex-col-reverse overflow-hidden rounded-md bg-surface-section"
                      title={`${bucket.label}: ${bucket.total} kayıt`}
                    >
                      {SOURCE_ORDER.map((source) => {
                        const count = bucket[source];
                        if (count <= 0) return null;
                        return (
                          <div
                            key={source}
                            className={SOURCE_COLORS[source]}
                            style={{ height: `${(count / maxBucket) * 100}%` }}
                          />
                        );
                      })}
                    </div>
                    <p className="text-center text-[10px] leading-tight text-subtle">{bucket.label}</p>
                    <p className="text-[10px] font-bold text-navy-900">{bucket.total}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

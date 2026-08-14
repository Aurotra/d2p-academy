import Link from "next/link";

import {
  formatCapacityOccupancy,
  formatCollectionMetric,
  type EventEnrollmentFinanceSummary,
} from "@/infrastructure/enrollments/event-enrollment-finance-summary";

interface EventEnrollmentFinanceSummaryBandProps {
  summary: EventEnrollmentFinanceSummary;
}

function MetricCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-surface bg-surface-section/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{title}</p>
      <p className="mt-1 text-lg font-bold text-navy-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function EventEnrollmentFinanceSummaryBand({
  summary,
}: EventEnrollmentFinanceSummaryBandProps) {
  const collection = formatCollectionMetric(summary);
  const occupancy = formatCapacityOccupancy(summary);

  return (
    <section className="rounded-[1.75rem] border border-border-surface bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-document-primary">
            Finansal özet
          </p>
          <p className="mt-1 text-sm text-muted">
            Bu etkinliğe ait tahsilat, kontenjan ve bekleyen iade durumu
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title={collection.title}
          value={collection.value}
          hint={collection.hint}
        />
        <MetricCard
          title="Kayıtlı"
          value={String(summary.confirmedSeatCount)}
          hint="registered / attended / completed"
        />
        <MetricCard
          title="Doluluk"
          value={occupancy.label}
          hint={occupancy.detail}
        />
        <MetricCard
          title="Bekleyen ödeme"
          value={String(summary.pendingPaymentCount)}
          hint="pending_payment"
        />
        <div className="rounded-2xl border border-border-surface bg-surface-section/60 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
            Açık iade
          </p>
          <p className="mt-1 text-lg font-bold text-navy-950">
            {summary.openRefundFollowupCount}
          </p>
          {summary.openRefundFollowupCount > 0 ? (
            <Link
              href="/admin/refund-followups"
              className="mt-1 inline-block text-xs font-semibold text-document-primary hover:underline"
            >
              Bekleyen İadeler →
            </Link>
          ) : (
            <p className="mt-1 text-xs text-muted">Açık iade yok</p>
          )}
        </div>
      </div>
    </section>
  );
}

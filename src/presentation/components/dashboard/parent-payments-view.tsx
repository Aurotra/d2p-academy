import { formatTryCentsDisplay } from "@/core/domain/payment";
import {
  PARENT_PAYMENT_STATUS_LABELS,
  type ParentPaymentListItem,
} from "@/core/domain/parent-payments";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Tarih belirtilmedi";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

interface ParentPaymentsViewProps {
  payments: ParentPaymentListItem[];
}

export function ParentPaymentsView({ payments }: ParentPaymentsViewProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-surface bg-surface-section px-4 py-10 text-center text-sm text-muted">
        Henüz bir ödeme kaydınız yok.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border-surface text-xs uppercase tracking-wide text-subtle">
          <tr>
            <th className="px-4 py-3">Etkinlik</th>
            <th className="px-4 py-3">Öğrenci</th>
            <th className="px-4 py-3">Tutar</th>
            <th className="px-4 py-3">Tarih</th>
            <th className="px-4 py-3">Durum</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const dateValue = payment.paidAt ?? payment.createdAt;
            return (
              <tr key={payment.id} className="border-b border-border-surface last:border-0">
                <td className="px-4 py-4 font-semibold text-navy-950">{payment.eventTitle}</td>
                <td className="px-4 py-4 text-navy-950">{payment.studentName}</td>
                <td className="px-4 py-4 text-navy-950">
                  {formatTryCentsDisplay(payment.amountTryCents)}
                </td>
                <td className="px-4 py-4 text-muted">{formatDate(dateValue)}</td>
                <td className="px-4 py-4">
                  <span className="inline-flex rounded-full bg-document-primary/10 px-3 py-1 text-xs font-bold text-document-primary">
                    {PARENT_PAYMENT_STATUS_LABELS[payment.status]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

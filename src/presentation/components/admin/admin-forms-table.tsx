import Link from "next/link";

import type { EnrollmentFormStatus } from "@/shared/utils/enrollment-form-status";

export interface AdminFormRow {
  enrollmentId: string;
  studentName: string;
  studentContact: string;
  eventId: string;
  eventTitle: string;
  eventStartAt: string | null;
  registeredAt: string;
  status: EnrollmentFormStatus;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function StatusCell({ done, notRequired = false }: { done: boolean; notRequired?: boolean }) {
  if (notRequired) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
        Gerekmez
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        done ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"
      }`}
    >
      {done ? "Tamam" : "Eksik"}
    </span>
  );
}

export function AdminFormsTable({ rows }: { rows: AdminFormRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        Bu filtreyle eşleşen form kaydı bulunamadı.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Öğrenci</th>
              <th className="px-5 py-3">Etkinlik</th>
              <th className="px-5 py-3">Tanışma</th>
              <th className="px-5 py-3">Onaylar</th>
              <th className="px-5 py-3">Ön test</th>
              <th className="px-5 py-3">Son test</th>
              <th className="px-5 py-3">Kayıt</th>
              <th className="px-5 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.enrollmentId} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{row.studentName}</p>
                  <p className="text-xs text-slate-500">{row.studentContact}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-900">{row.eventTitle}</p>
                  {row.eventStartAt ? (
                    <p className="text-xs text-slate-500">{formatDate(row.eventStartAt)}</p>
                  ) : null}
                </td>
                <td className="px-5 py-4">
                  <StatusCell done={row.status.intakeDone} />
                </td>
                <td className="px-5 py-4">
                  <StatusCell done={row.status.consentsDone} />
                </td>
                <td className="px-5 py-4">
                  <StatusCell done={row.status.preTestDone} notRequired={!row.status.requiresSurveys} />
                </td>
                <td className="px-5 py-4">
                  <StatusCell done={row.status.postTestDone} notRequired={!row.status.requiresSurveys} />
                </td>
                <td className="px-5 py-4 text-slate-600">{formatDate(row.registeredAt)}</td>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/enrollments/${row.enrollmentId}/forms`}
                    className="inline-flex min-h-[40px] items-center rounded-xl bg-navy-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-document-primary"
                  >
                    Formları aç
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

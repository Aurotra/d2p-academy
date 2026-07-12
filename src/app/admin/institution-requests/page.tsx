import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import {
  InstitutionRequestStatusSelector,
  type InstitutionRequestStatus,
} from "@/presentation/components/admin/institution-request-status-selector";

export const dynamic = "force-dynamic";

interface InstitutionRequestRow {
  id: string;
  institution_name: string;
  institution_type: string;
  contact_name: string;
  phone: string;
  email: string;
  city: string;
  student_count: string;
  package_interest: string;
  message: string | null;
  status: InstitutionRequestStatus;
  created_at: string;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function AdminInstitutionRequestsPage() {
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const access = await getAdminAccess(client);

  if (!access.authorized) {
    redirect("/login");
  }

  const { data, error } = await client
    .from("institution_requests")
    .select(
      "id, institution_name, institution_type, contact_name, phone, email, city, student_count, package_interest, message, status, created_at",
    )
    .order("created_at", { ascending: false });

  const requests = (data ?? []) as InstitutionRequestRow[];

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Kurumsal Talepler
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Kurumsal Eğitim Talepleri</h1>
        <p className="mt-2 text-sm text-slate-600">
          Okul, belediye ve diğer kurumlardan gelen toplu eğitim / organizasyon taleplerini
          yönetin.
        </p>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Talepler yüklenemedi: {error.message}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Kurum</th>
                <th className="px-5 py-4">Yetkili</th>
                <th className="px-5 py-4">Paket / Sayı</th>
                <th className="px-5 py-4">Durum</th>
                <th className="px-5 py-4">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    Henüz kurumsal talep yok
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="border-b border-slate-50 last:border-0 align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{request.institution_name}</p>
                      <p className="text-xs text-slate-500">{request.institution_type}</p>
                      <p className="text-xs text-slate-500">{request.city}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{request.contact_name}</p>
                      <p className="text-xs text-slate-500">{request.phone}</p>
                      <p className="text-xs text-slate-500">{request.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-800">{request.package_interest}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.student_count} kişi</p>
                      {request.message ? (
                        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                          {request.message}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <InstitutionRequestStatusSelector
                        requestId={request.id}
                        initialStatus={request.status}
                      />
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(request.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

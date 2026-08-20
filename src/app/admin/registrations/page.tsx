import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import {
  RegistrationEditableRow,
  type AdminRegistrationRow,
} from "@/presentation/components/admin/registration-editable-row";

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminRegistrationsPage() {
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const access = await getAdminAccess(client);

  if (!access.authorized) {
    redirect("/login");
  }

  const { data, error } = await client
    .from("registrations")
    .select(
      "id, full_name, phone, email, grade, course, status, created_at, is_minor, guardian_name, guardian_phone, campaign, time_group",
    )
    .order("created_at", { ascending: false });

  const registrations = (data ?? []) as AdminRegistrationRow[];

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border-surface bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Arşiv
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy-950">Eski Ön Kayıtlar</h1>
        <p className="mt-2 text-sm text-muted">
          Kapatılan ön kayıt formundan gelen başvurular. Yeni kayıtlar veli hesabı ve etkinlik
          kaydı üzerinden alınır. Bu arşiv menüde yer almaz; doğrudan bu adresten açılır.
        </p>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Kayıtlar yüklenemedi: {error.message}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border-surface bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-surface bg-surface-section text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="px-5 py-4">Ad Soyad</th>
                <th className="px-5 py-4">Telefon</th>
                <th className="px-5 py-4">Grup / Düzey</th>
                <th className="px-5 py-4">Atölye / Etkinlik</th>
                <th className="px-5 py-4">Durum</th>
                <th className="px-5 py-4">Kayıt / İşlem</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-subtle">
                    Henüz ön kayıt yok
                  </td>
                </tr>
              ) : (
                registrations.map((registration) => (
                  <RegistrationEditableRow
                    key={registration.id}
                    registration={registration}
                    formattedDate={formatDate(registration.created_at)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

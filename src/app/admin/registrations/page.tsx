import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { getKaklikCampaignSettings } from "@/infrastructure/settings/site-settings";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { KaklikCampaignToggleCard } from "@/presentation/components/admin/kaklik-campaign-toggle-card";
import {
  RegistrationEditableRow,
  type AdminRegistrationRow,
} from "@/presentation/components/admin/registration-editable-row";
import {
  formatKaklikTimeGroup,
  KAKLIK_CAMPAIGN_ID,
  KAKLIK_CAMPAIGN_TITLE,
  KAKLIK_TIME_GROUPS,
} from "@/shared/constants/kaklik-campaign";

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

interface AdminRegistrationsPageProps {
  searchParams: Promise<{ campaign?: string; group?: string }>;
}

export default async function AdminRegistrationsPage({
  searchParams,
}: AdminRegistrationsPageProps) {
  const params = await searchParams;
  const campaignFilter = params.campaign?.trim() || null;
  const groupFilter = params.group?.trim() || null;

  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const access = await getAdminAccess(client);

  if (!access.authorized) {
    redirect("/login");
  }

  const campaignSettings = await getKaklikCampaignSettings(client);

  let query = client
    .from("registrations")
    .select(
      "id, full_name, phone, email, grade, course, status, created_at, is_minor, guardian_name, guardian_phone, campaign, time_group",
    )
    .order("created_at", { ascending: false });

  if (campaignFilter) {
    query = query.eq("campaign", campaignFilter);
  }
  if (groupFilter) {
    query = query.eq("time_group", groupFilter);
  }

  const { data, error } = await query;
  const registrations = (data ?? []) as AdminRegistrationRow[];

  const filterHref = (next: { campaign?: string | null; group?: string | null }) => {
    const search = new URLSearchParams();
    const campaign = next.campaign === undefined ? campaignFilter : next.campaign;
    const group = next.group === undefined ? groupFilter : next.group;
    if (campaign) search.set("campaign", campaign);
    if (group) search.set("group", group);
    const qs = search.toString();
    return qs ? `/admin/registrations?${qs}` : "/admin/registrations";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Ön Kayıt Yönetimi
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Ön Kayıtlar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Web sitesinden gelen ön kayıtları görüntüleyin, düzenleyin ve durumlarını güncelleyin.
          Kaklık başvurularını gruba göre filtreleyebilirsiniz.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/registrations"
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              !campaignFilter && !groupFilter
                ? "bg-document-primary text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tümü
          </Link>
          <Link
            href={filterHref({ campaign: KAKLIK_CAMPAIGN_ID, group: null })}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              campaignFilter === KAKLIK_CAMPAIGN_ID && !groupFilter
                ? "bg-document-primary text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {KAKLIK_CAMPAIGN_TITLE}
          </Link>
          {KAKLIK_TIME_GROUPS.map((group) => (
            <Link
              key={group.value}
              href={filterHref({ campaign: KAKLIK_CAMPAIGN_ID, group: group.value })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                groupFilter === group.value
                  ? "bg-sky-700 text-white"
                  : "bg-sky-50 text-sky-900 hover:bg-sky-100"
              }`}
            >
              {formatKaklikTimeGroup(group.value)}
            </Link>
          ))}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Kayıtlar yüklenemedi: {error.message}
          </p>
        ) : null}
      </div>

      <KaklikCampaignToggleCard initialSettings={campaignSettings} />

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
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

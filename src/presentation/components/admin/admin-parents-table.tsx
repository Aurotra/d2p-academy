"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { AdminParentRecord } from "@/core/domain/admin-parent";
import { formatTurkishPhoneDisplay } from "@/shared/utils/turkish-phone";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function phoneLink(value: string) {
  const display = formatTurkishPhoneDisplay(value);
  const tel = value.replace(/\s/g, "");

  return (
    <a href={`tel:${tel}`} className="font-semibold text-document-primary hover:underline">
      {display}
    </a>
  );
}

function contactPhoneSource(parent: AdminParentRecord): "account" | "profile" | "none" {
  if (parent.accountPhone?.trim()) {
    return "account";
  }
  if (parent.profileContactPhone?.trim()) {
    return "profile";
  }
  return "none";
}

function ContactPhoneCell({ parent }: { parent: AdminParentRecord }) {
  const source = contactPhoneSource(parent);

  if (!parent.contactPhone) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
        Telefon eksik
      </span>
    );
  }

  return (
    <div className="min-w-[9.5rem] space-y-1">
      {phoneLink(parent.contactPhone)}
      <p className="text-xs text-subtle">
        {source === "account" ? "Veli hesabı" : "Çocuk profili"}
      </p>
      {parent.accountPhone?.trim() &&
      parent.profileContactPhone?.trim() &&
      parent.accountPhone.trim() !== parent.profileContactPhone.trim() ? (
        <p className="text-xs text-subtle">
          Profil: {formatTurkishPhoneDisplay(parent.profileContactPhone)}
        </p>
      ) : null}
    </div>
  );
}

function StatPill({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone: "slate" | "emerald" | "amber";
  onClick: () => void;
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-900"
      : tone === "amber"
        ? "bg-amber-100 text-amber-900"
        : "bg-surface-section text-[var(--text-on-surface-soft)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-semibold transition ${toneClass} ${
        active ? "ring-2 ring-document-primary/30 ring-offset-1" : "hover:opacity-90"
      }`}
    >
      {label}
    </button>
  );
}

export function AdminParentsTable({
  parents,
  stats,
}: {
  parents: AdminParentRecord[];
  stats: { total: number; withPhone: number; missing: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneFilter = searchParams.get("phone") ?? "all";

  function setPhoneFilter(next: "all" | "with" | "missing") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("phone");
    } else {
      params.set("phone", next);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/parents?${qs}` : "/admin/parents");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatPill
          label={`Toplam veli: ${stats.total}`}
          active={phoneFilter === "all"}
          tone="slate"
          onClick={() => setPhoneFilter("all")}
        />
        <StatPill
          label={`Telefonu olan: ${stats.withPhone}`}
          active={phoneFilter === "with"}
          tone="emerald"
          onClick={() => setPhoneFilter("with")}
        />
        <StatPill
          label={`Telefon eksik: ${stats.missing}`}
          active={phoneFilter === "missing"}
          tone="amber"
          onClick={() => setPhoneFilter("missing")}
        />
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border-surface bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[56rem] w-full text-left text-sm">
            <thead className="border-b border-border-surface bg-surface-section text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="sticky left-0 z-10 min-w-[11rem] bg-surface-section px-4 py-4 sm:px-5">
                  Veli
                </th>
                <th className="min-w-[10rem] px-4 py-4 sm:px-5">Telefon</th>
                <th className="min-w-[12rem] px-4 py-4 sm:px-5">Çocuklar</th>
                <th className="whitespace-nowrap px-4 py-4 sm:px-5">Kayıt</th>
                <th className="whitespace-nowrap px-4 py-4 sm:px-5">Durum</th>
              </tr>
            </thead>
            <tbody>
              {parents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-subtle">
                    Kayıtlı veli bulunamadı.
                  </td>
                </tr>
              ) : (
                parents.map((parent) => (
                  <tr key={parent.id} className="border-b border-border-surface align-top last:border-0">
                    <td className="sticky left-0 z-10 min-w-[11rem] bg-white px-4 py-4 sm:px-5">
                      <p className="font-semibold text-navy-950">{parent.fullName}</p>
                      {parent.email ? (
                        <a
                          href={`mailto:${parent.email}`}
                          className="mt-1 block break-all text-xs text-document-primary hover:underline"
                        >
                          {parent.email}
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-subtle">E-posta yok</p>
                      )}
                    </td>
                    <td className="px-4 py-4 sm:px-5">
                      <ContactPhoneCell parent={parent} />
                    </td>
                    <td className="px-4 py-4 text-[var(--text-on-surface-soft)] sm:px-5">
                      {parent.children.length === 0 ? (
                        <span className="text-subtle">—</span>
                      ) : (
                        <ul className="space-y-2">
                          {parent.children.map((child) => (
                            <li key={child.id} className="min-w-0">
                              <Link
                                href={`/admin/students/${child.id}`}
                                className="font-medium text-navy-950 hover:text-document-primary hover:underline"
                              >
                                {child.fullName}
                              </Link>
                              {child.username ? (
                                <span className="block text-xs text-subtle">@{child.username}</span>
                              ) : null}
                              {child.parentPhone ? (
                                <span className="mt-0.5 block text-xs text-subtle">
                                  Veli tel: {formatTurkishPhoneDisplay(child.parentPhone)}
                                </span>
                              ) : (
                                <span className="mt-0.5 block text-xs text-amber-700">
                                  Profil telefonu eksik
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-muted sm:px-5">
                      {formatDate(parent.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
                          parent.isActive
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-surface-section text-[var(--text-on-surface-soft)]"
                        }`}
                      >
                        {parent.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
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

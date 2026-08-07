import type { AdminParentRecord } from "@/core/domain/admin-parent";
import { formatTurkishPhoneDisplay } from "@/shared/utils/turkish-phone";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function phoneCell(value: string | null) {
  if (!value?.trim()) {
    return <span className="text-slate-400">—</span>;
  }

  const display = formatTurkishPhoneDisplay(value);
  const tel = value.replace(/\s/g, "");

  return (
    <a href={`tel:${tel}`} className="font-medium text-document-primary hover:underline">
      {display}
    </a>
  );
}

export function AdminParentsTable({ parents }: { parents: AdminParentRecord[] }) {
  const withPhoneCount = parents.filter((parent) => Boolean(parent.contactPhone)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
          Toplam veli: {parents.length}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-900">
          Telefonu olan: {withPhoneCount}
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">
          Telefon eksik: {parents.length - withPhoneCount}
        </span>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Veli adı</th>
                <th className="px-5 py-4">E-posta</th>
                <th className="px-5 py-4">İletişim telefonu</th>
                <th className="px-5 py-4">Hesap telefonu</th>
                <th className="px-5 py-4">Çocuk profili telefonu</th>
                <th className="px-5 py-4">Çocuklar</th>
                <th className="px-5 py-4">Kayıt</th>
                <th className="px-5 py-4">Durum</th>
              </tr>
            </thead>
            <tbody>
              {parents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                    Kayıtlı veli bulunamadı.
                  </td>
                </tr>
              ) : (
                parents.map((parent) => (
                  <tr key={parent.id} className="border-b border-slate-50 align-top last:border-0">
                    <td className="px-5 py-4 font-semibold text-slate-900">{parent.fullName}</td>
                    <td className="px-5 py-4 text-slate-700">
                      {parent.email ? (
                        <a
                          href={`mailto:${parent.email}`}
                          className="text-document-primary hover:underline"
                        >
                          {parent.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-4">{phoneCell(parent.contactPhone)}</td>
                    <td className="px-5 py-4">{phoneCell(parent.accountPhone)}</td>
                    <td className="px-5 py-4">{phoneCell(parent.profileContactPhone)}</td>
                    <td className="px-5 py-4 text-slate-700">
                      {parent.children.length === 0 ? (
                        "—"
                      ) : (
                        <ul className="space-y-1">
                          {parent.children.map((child) => (
                            <li key={child.id}>
                              <span className="font-medium text-slate-900">{child.fullName}</span>
                              {child.username ? (
                                <span className="text-slate-500"> @{child.username}</span>
                              ) : null}
                              {child.parentPhone ? (
                                <span className="block text-xs text-slate-500">
                                  {formatTurkishPhoneDisplay(child.parentPhone)}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(parent.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          parent.isActive
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-slate-200 text-slate-700"
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

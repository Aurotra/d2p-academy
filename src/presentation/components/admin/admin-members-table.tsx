import type { AdminMember } from "@/core/domain/admin-member";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function roleLabel(role: AdminMember["role"]): string {
  return role === "parent" ? "Veli" : "Üye öğrenci";
}

export function AdminMembersTable({ members }: { members: AdminMember[] }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4">Ad Soyad</th>
              <th className="px-5 py-4">E-posta</th>
              <th className="px-5 py-4">Tür</th>
              <th className="px-5 py-4">Telefon</th>
              <th className="px-5 py-4">Çocuk</th>
              <th className="px-5 py-4">Kayıt</th>
              <th className="px-5 py-4">Durum</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                  Kayıtlı üye bulunamadı.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-4 font-semibold text-slate-900">{member.fullName}</td>
                  <td className="px-5 py-4 text-slate-700">{member.email ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        member.role === "parent"
                          ? "bg-sky-100 text-sky-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {roleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{member.phone ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-700">
                    {member.role === "parent" ? member.childCount : "—"}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(member.createdAt)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        member.isActive
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {member.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

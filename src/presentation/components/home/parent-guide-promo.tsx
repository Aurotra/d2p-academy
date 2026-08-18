import Link from "next/link";

import { PARENT_GUIDE_PATH } from "@/shared/constants/parent-guide";

const steps = [
  { title: "Hesap oluştur", detail: "E-postanı onayla" },
  { title: "Çocuk ekle", detail: "Kullanıcı adını not al" },
  { title: "Etkinliğe kaydet", detail: "Formları sonra doldurursun" },
] as const;

export function ParentGuidePromo() {
  return (
    <div
      id="veli-rehberi"
      className="scroll-mt-24 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
    >
      <ol className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-navy-950">{step.title}</span>
              <span className="block text-xs leading-5 text-muted">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>

      <Link
        href={PARENT_GUIDE_PATH}
        className="shrink-0 text-sm font-semibold text-secondary hover:underline sm:text-right"
      >
        Veli rehberi →
      </Link>
    </div>
  );
}

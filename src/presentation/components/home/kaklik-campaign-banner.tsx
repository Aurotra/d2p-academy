import Link from "next/link";

import {
  KAKLIK_CAMPAIGN_BANNER_TEXT,
  KAKLIK_CAMPAIGN_TITLE,
} from "@/shared/constants/kaklik-campaign";

export function KaklikCampaignBanner() {
  return (
    <div className="relative z-20 border-b border-sky-700/30 bg-gradient-to-r from-sky-900 via-document-primary to-sky-800 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200">
            {KAKLIK_CAMPAIGN_TITLE}
          </p>
          <p className="mt-1 text-sm font-bold leading-snug sm:text-base">
            {KAKLIK_CAMPAIGN_BANNER_TEXT}
          </p>
        </div>
        <Link
          href="#kaklik-kayit"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-black text-document-primary shadow-sm transition hover:bg-sky-50"
        >
          Hemen Kayıt Ol
        </Link>
      </div>
    </div>
  );
}

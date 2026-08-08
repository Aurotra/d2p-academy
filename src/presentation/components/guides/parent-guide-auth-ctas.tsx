"use client";

import Link from "next/link";

import { AuthPortalLink } from "@/presentation/components/auth/auth-portal-link";
import { GuestOnly } from "@/presentation/components/auth/guest-only";

export function ParentGuideAuthCtas() {
  return (
    <GuestOnly>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-secondary/20 transition hover:bg-secondary-hover hover:shadow-glow-secondary"
        >
          Hesap Oluştur
        </Link>
        <AuthPortalLink href="/login" kind="parent">
          Veli Girişi
        </AuthPortalLink>
        <AuthPortalLink href="/student-login" kind="student">
          Öğrenci Girişi
        </AuthPortalLink>
        <Link
          href="/etkinlikler"
          className="inline-flex items-center justify-center rounded-xl border border-border-surface bg-white px-5 py-3 text-sm font-semibold text-navy-900 transition hover:border-secondary/40"
        >
          Etkinlikler
        </Link>
      </div>
    </GuestOnly>
  );
}

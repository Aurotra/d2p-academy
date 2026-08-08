"use client";

import Link from "next/link";

import { GuestOnly } from "@/presentation/components/auth/guest-only";

export function InstitutionRequestGuestNote() {
  return (
    <GuestOnly>
      <p className="mt-3 text-sm text-subtle">
        Bireysel kayıt için{" "}
        <Link href="/etkinlikler" className="font-semibold text-document-primary hover:underline">
          etkinliklere göz atın
        </Link>{" "}
        veya{" "}
        <Link href="/register" className="font-semibold text-document-primary hover:underline">
          veli hesabı oluşturun
        </Link>
        .
      </p>
    </GuestOnly>
  );
}

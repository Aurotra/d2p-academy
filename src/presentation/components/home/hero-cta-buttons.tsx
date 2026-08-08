"use client";

import Link from "next/link";

import { GuestOnly } from "@/presentation/components/auth/guest-only";
import { Button } from "@/presentation/components/ui/button";
import { useSiteAuth } from "@/presentation/providers/site-auth-provider";

export function HeroCtaButtons() {
  const { isAuthResolved, isLoggedIn, panelHref } = useSiteAuth();

  return (
    <div className="mt-8 space-y-5">
      <div className="grid items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        <div className="flex h-full flex-col rounded-2xl border border-border-surface bg-white/75 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-dark">
            Atölye kaydı
          </p>
          <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-on-surface-soft)]">
            Yaklaşan etkinlikleri inceleyin; veli hesabıyla çocuğunuzu doğrudan kaydedin.
          </p>
          <Link href="/etkinlikler" className="mt-4 inline-flex w-full sm:w-auto">
            <Button variant="accent" className="min-h-[44px] w-full sm:w-auto">
              Etkinliklere Göz At
            </Button>
          </Link>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-border-surface bg-white/75 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            Veli hesabı
          </p>
          <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-on-surface-soft)]">
            {isLoggedIn
              ? "Çocuklarınızı ekleyin, etkinlik kayıtlarını ve formları panelden yönetin."
              : "Ücretsiz veli hesabı açın; etkinlik kaydı ve çocuk profilleri tek panelde."}
          </p>
          {isAuthResolved && isLoggedIn ? (
            <Link href={panelHref} className="mt-4 inline-flex w-full sm:w-auto">
              <Button variant="secondary" className="min-h-[44px] w-full sm:w-auto">
                Panele Git
              </Button>
            </Link>
          ) : null}
          <GuestOnly>
            <Link href="/register" className="mt-4 inline-flex w-full sm:w-auto">
              <Button variant="secondary" className="min-h-[44px] w-full sm:w-auto">
                Veli Hesabı Oluştur
              </Button>
            </Link>
          </GuestOnly>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-border-surface bg-white/75 p-4 backdrop-blur-sm sm:col-span-2 sm:p-5 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Kurumlar için
          </p>
          <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-on-surface-soft)]">
            Okul, belediye ve kurumlar için toplu eğitim paketi / organizasyon talebi.
          </p>
          <Link href="/kurumsal-talep" className="mt-4 inline-flex w-full sm:w-auto">
            <Button variant="primary" className="min-h-[44px] w-full sm:w-auto">
              Kurumsal Eğitim Talebi
            </Button>
          </Link>
        </div>
      </div>

      <Link href="/etkinlikler" className="inline-flex">
        <Button variant="ghost" className="min-h-[44px] px-0 text-navy-900 underline-offset-4 hover:underline">
          Tüm etkinlikleri gör →
        </Button>
      </Link>
    </div>
  );
}

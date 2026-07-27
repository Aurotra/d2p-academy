"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { Button } from "@/presentation/components/ui/button";

export function HeroCtaButtons() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      return;
    }

    void client.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="mt-8 space-y-5">
      <div className="grid items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        <div className="flex h-full flex-col rounded-2xl border border-sky-200/80 bg-white/70 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-document-primary">
            Atölye kaydı
          </p>
          <p className="mt-2 flex-1 text-sm leading-6 text-sky-900/80">
            Yaklaşan etkinlikleri inceleyin; veli hesabıyla çocuğunuzu doğrudan kaydedin.
          </p>
          <Link href="/etkinlikler" className="mt-4 inline-flex w-full sm:w-auto">
            <Button className="min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document sm:w-auto">
              Etkinliklere Göz At
            </Button>
          </Link>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-sky-200/80 bg-white/70 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            Veli hesabı
          </p>
          <p className="mt-2 flex-1 text-sm leading-6 text-sky-900/80">
            {isLoggedIn
              ? "Çocuklarınızı ekleyin, etkinlik kayıtlarını ve formları panelden yönetin."
              : "Ücretsiz veli hesabı açın; etkinlik kaydı ve çocuk profilleri tek panelde."}
          </p>
          {isLoggedIn ? (
            <Link href="/dashboard" className="mt-4 inline-flex w-full sm:w-auto">
              <Button variant="secondary" className="min-h-[44px] w-full sm:w-auto">
                Panele Git
              </Button>
            </Link>
          ) : (
            <Link href="/register" className="mt-4 inline-flex w-full sm:w-auto">
              <Button variant="secondary" className="min-h-[44px] w-full sm:w-auto">
                Veli Hesabı Oluştur
              </Button>
            </Link>
          )}
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-sky-200/80 bg-white/70 p-4 backdrop-blur-sm sm:col-span-2 sm:p-5 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Kurumlar için
          </p>
          <p className="mt-2 flex-1 text-sm leading-6 text-sky-900/80">
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
        <Button variant="ghost" className="min-h-[44px] px-0 text-sky-900 underline-offset-4 hover:underline">
          Tüm etkinlikleri gör →
        </Button>
      </Link>
    </div>
  );
}

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
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-sky-200/80 bg-white/70 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-document-primary">
            Atölye başvurusu
          </p>
          <p className="mt-2 text-sm leading-6 text-sky-900/80">
            Eylül dönemi atölyeleri için hızlı form. Hesap açmaya gerek yok; sizi ararız.
          </p>
          <Link href="/kayit" className="mt-4 inline-flex w-full sm:w-auto">
            <Button className="min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document sm:w-auto">
              Eylül Dönemi Ön Kaydı
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-sky-200/80 bg-white/70 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
            Öğrenci paneli
          </p>
          <p className="mt-2 text-sm leading-6 text-sky-900/80">
            {isLoggedIn
              ? "Dökümanlar, notlar ve profiliniz için öğrenci panelinize gidin."
              : "Döküman, not ve profil için e-posta ile üyelik oluşturun."}
          </p>
          {isLoggedIn ? (
            <Link href="/dashboard" className="mt-4 inline-flex w-full sm:w-auto">
              <Button variant="outline" className="min-h-[44px] w-full sm:w-auto">
                Panele Git
              </Button>
            </Link>
          ) : (
            <Link href="/register" className="mt-4 inline-flex w-full sm:w-auto">
              <Button variant="outline" className="min-h-[44px] w-full sm:w-auto">
                Öğrenci Hesabı Oluştur
              </Button>
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-sky-200/80 bg-white/70 p-4 backdrop-blur-sm sm:p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-800">
            Kurumlar için
          </p>
          <p className="mt-2 text-sm leading-6 text-sky-900/80">
            Okul, belediye ve kurumlar için toplu eğitim paketi / organizasyon talebi.
          </p>
          <Link href="/kurumsal-talep" className="mt-4 inline-flex w-full sm:w-auto">
            <Button variant="outline" className="min-h-[44px] w-full sm:w-auto">
              Kurumsal Eğitim Talebi
            </Button>
          </Link>
        </div>
      </div>

      <a href="#events" className="inline-flex">
        <Button variant="ghost" className="min-h-[44px] px-0 text-sky-900 underline-offset-4 hover:underline">
          Etkinlik takvimini gör →
        </Button>
      </a>
    </div>
  );
}

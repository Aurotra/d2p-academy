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
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Link href="/kayit">
        <Button className="w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document sm:w-auto">
          Ön Kayıt Ol
        </Button>
      </Link>
      {isLoggedIn ? (
        <Link href="/dashboard">
          <Button variant="outline" className="w-full sm:w-auto">
            Panele Git
          </Button>
        </Link>
      ) : (
        <Link href="/register">
          <Button variant="outline" className="w-full sm:w-auto">
            Hemen Kayıt Ol
          </Button>
        </Link>
      )}
      <a href="#events">
        <Button variant="outline" className="w-full sm:w-auto">
          Etkinlik Takvimini Gör
        </Button>
      </a>
    </div>
  );
}
